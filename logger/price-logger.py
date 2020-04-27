#!/usr/bin/env python3

import os
import re
import json
import time
from datetime import date, datetime
import requests
import argparse
import logging
import lxml.html
from urllib.parse import urljoin
import random
import mail
import traceback
import html
import sys
from PIL import Image
import urllib

DEBUG = True

def log_info(item, msg):
    current_time = datetime.now().isoformat()
    print(f"{current_time} - {item['url']} - {msg}")

def log_price(item, price):
    current_time = datetime.now().isoformat()
    if DEBUG:
        log_info(item, f"{price:.2f}")
    with open(f'../logs/{item["id"]}.txt', 'a+') as file:
        file.write(f"{current_time} - {price:.2f}\n")

def log_error(msg_short, url, msg):
    msg_mail = msg.replace('\n', '<br/>')
    mail.send_error(config["mail"], f"<a href='{url}'>{url}</a><br/>{msg_mail}", msg_short)
    msg_log = msg.replace("\n", " - ")
    print(f"{msg_short}: {url} - {msg_log}")

def get_price(item, tree, url, text):
    sel = item["xpath_price"]
    price = tree.xpath(sel)
    if len(price) == 0:
        l = [text[m.start(0) - 50:m.end(0) + 50] for m in re.finditer(r"id=.priceblock_ourptice.", text)]
        if len(l) > 0:
            log_error("Price not found", url, f"""Selector {sel}
{l}""")
        else:
            avail = tree.xpath(item["xpath_avail"])
            if len(avail) == 0:
                # something went horribly wrong
                log_error("Maybe amazon found out?", url, f"""Selector {sel} empty
Availability: {avail}""")
                return
            avail = avail[0]
            avail = avail.strip()
            log_error("Price not found", url, f"""Selector {sel} empty
Availability: {avail}""")
            if "Derzeit nicht verfügbar" in avail:
                item["url"] = None
                log_info(item, "Disabled scraping.")
        return
    price = price[0].strip()
    g = re.match(item['price_selector'], price)
    if not g:
        log_error("Empty selection", url, f"""Regex {item['price_selector']} did not match in {price}""")
        return
    price = g[1]
    price = float(price.replace(',', '.'))
    log_price(item, price)
    history = item["last"]
    increase_poll = False
    history.append(price)
    if min(history) == price and max(history) == price:
        # nothing changed, increase poll
        increase_poll = True
    if len(history) > 5:
        history.pop(0)
    item["last"] = history
    if price < item['threshold']:
        mail.send_mail(config['mail'], item, price)
    return increase_poll

def get_image(item, tree, url, text):
    if not os.path.isfile('../logs/{}.jpg'.format(item['id'])):
        sel = item['xpath_img']
        l = [text[m.start(0) - 100:m.end(0) + 50] for m in re.finditer(r"id=.landingImage.", text)]
        img = tree.xpath(sel)
        if len(img) == 0:
            log_error("Image not found", url, f"""Selector {sel}
{l}""")
            return
        img = img[0]
        obj = json.loads(img)
        image_url = list(obj.keys())[0]
        urllib.request.urlretrieve(image_url, "../logs/{}.jpg".format(item['id']))
    if not os.path.isfile('../logs/{}.thumbnail'.format(item['id'])):
        img = Image.open("../logs/{}.jpg".format(item['id']))
        img.thumbnail((48, 48), Image.ANTIALIAS)
        img.save("../logs/{}.thumbnail".format(item['id']), 'JPEG')

def get_title(item, tree, url, text):
    sel = item['xpath_title']
    title = tree.xpath(sel)
    if len(title) == 0:
        l = [text[m.start(0) - 50:m.end(0) + 150] for m in re.finditer(r"id=.title. ", text)]
        log_error("Title not found", url, f"""Selector {sel}
{l}""")
        return
    title = title[0].strip()
    item['title'] = title
    write_infos(item["id"], "title", title)

def write_infos(id, key, value):
    infos = {}
    if os.path.isfile(f'../logs/{id}.json'):
        with open(f'../logs/{id}.json', 'r+') as f:
            infos = f.read()
    with open(f'../logs/{id}.json', 'w+') as f:
        if infos:
            infos = json.loads(infos)
        else:
            infos = {}
        infos[key] = value
        f.write(json.dumps(infos, sort_keys=True, indent=4))

def scrape(item):
    # use random user agent
    ua = config['user_agents'][random.randint(0, len(config['user_agents']) - 1)]
    url = item["url"]
    try:
        r = requests.get(url, headers={
            'User-Agent': ua
        })
        r.raise_for_status()
        if r.status_code != 200:
            log_error("Wrong Status", url, f"""Status code {r.status_code}
UA: {ua}""")
    except requests.exceptions.RequestException as e:
        log_error("Connection failed", url, f"""Can't connect, trying again later
{e}""")
        return False
    text = r.text.replace("\xa0", " ")
    tree = lxml.html.fromstring(text)

    # price
    increase_poll = get_price(item, tree, url, text)

    # image
    get_image(item, tree, url, text)

    # infos
    if not 'title' in item:
        get_title(item, tree, url, text)
    write_infos(item["id"], "url", item["url"])

    return increase_poll

def get_config(config):
    with open(config, 'r') as f:
        config = json.loads(f.read())
    for item in config["items"]:
        sel = item["parent"]
        if sel:
            for k, v in config["selectors"][sel].items():
                item[k] = v
    return config

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-c', '--config',
        default='{}/config.json'.format(os.path.dirname(os.path.realpath(__file__))),
        help='Configuration file path')
    parser.add_argument('-d', '--debug',
        action='store_true',
        help='Enable debug level logging')
    return parser.parse_args()

def main():
    global config
    global DEBUG

    args = parse_args()
    DEBUG = args.debug
    config = get_config(args.config)

    poll_interval = config["poll"]
    poll_deviation = config["poll_deviation"]
    print(f"Logger started: Configured poll intervall {poll_interval} Seconds with deviation of {poll_deviation} Seconds. Debug {DEBUG}.")

    if DEBUG:
        config["mail"] = ""

    if not os.path.exists('../logs'):
        os.mkdir('../logs')

    # build item list
    items = {}
    for item in config['items']:
        initial_delay = random.randint(0, poll_interval)
        current_time = datetime.now().timestamp()
        items[item['id']] = {
            'id': item['id'],
            'next_exec': current_time + initial_delay,
            "poll": poll_interval,
            "last" : []
        }
        for i in item:
            items[item['id']][i] = item[i]
        items[item['id']]['url'] = urljoin(item['base_url'], item['id'])
        if os.path.isfile('../logs/{}.json'.format(item['id'])):
            with open('../logs/{}.json'.format(item['id']), 'r+') as file:
                loaded = json.load(file)
                if 'title' in loaded:
                    items[item['id']]['title'] = loaded['title']
        # print(items[item['id']])

    while True:
        current_time = datetime.now().timestamp()

        for item_id, data in items.items():
            if data['next_exec'] < current_time:
                if not items[item_id]['url']:
                    # do not scrape again
                    data['next_exec'] = current_time + (60 * 60 * 24 * 30)
                    continue
                if scrape(items[item_id]):
                    # increase poll intervall to a configured max
                    if data["poll"] != config["poll_timeout_max"]:
                        data["poll"] += poll_interval
                        if data["poll"] > config["poll_timeout_max"]:
                            data["poll"] = config["poll_timeout_max"]
                        log_info(data, f"Poll intervall increased to {data['poll']}")
                else:
                    # reset poll intervall
                    data["poll"] = poll_interval
                    log_info(data, f"Poll intervall resetted to {data['poll']}")

                data['next_exec'] = current_time + random.randint(data["poll"] - poll_deviation, data["poll"] + poll_deviation)

        time.sleep(config["check_timeout"])


if __name__ == '__main__':
    with open("pid", "w+") as f:
        f.write(str(os.getpid()))

    main()
