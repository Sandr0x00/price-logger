#!/usr/bin/env python3

import os
import re
import json
import time
from datetime import date, datetime
import requests
import argparse
import logging
from lxml import html
from urllib.parse import urljoin
import random
import mail
import image
import traceback

def log_price(item, price):
    current_time = datetime.now().isoformat()
    logger.info('{} - {} - {:.2f}'.format(current_time, item['id'], price))
    with open('../logs/{}.txt'.format(item['id']), 'a+') as file:
        file.write("{} - {:.2f}\n".format(current_time, price))


def get_price(item):
    # use random user agent
    ua = random.randint(0, len(config['user_agents']) - 1)
    try:
        r = requests.get(item['url'], headers={
            'User-Agent': config['user_agents'][ua]
        })
        r.raise_for_status()
        tree = html.fromstring(r.text)
        # extract the price from the string
        price = re.findall(item['price_selector'], tree.xpath(item['xpath_price'])[0].text)[0]
        if not os.path.isfile('../logs/{}.jpg'.format(item['id'])):
            image.save_image(item, tree)
        if not os.path.isfile('../logs/{}.thumbnail'.format(item['id'])):
            image.save_thumbnail(item)
        if not 'title' in item:
            get_infos(item, tree)
        # we found the price, now cut "EUR " and parse english format
        price_f = float(price[4:].replace(',', '.'))
        log_price(item, price_f)
        if price_f < item['threshold']:
            mail.send_mail(config['mail'], item, price_f)
    except requests.exceptions.RequestException as e:
        logger.debug(e)
        mail.send_error(config['mail'], 'Can\'t connect, trying again later.')
        logger.warning('Can\'t connect, trying again later.')
    except (IndexError, TypeError) as e:
        error = '''
        Didn\'t find the \'price\' element, trying again later.<br>
        User-Agent: {}<br>
        Error: {}<br>
        Item: {}<br>
        Response: <code>{}</code>
        '''.format(config['user_agents'][ua], traceback.extract_stack(), item['id'], html.tostring(tree, encoding="ascii"))
        mail.send_error(config['mail'], error)
        logger.warning('Didn\'t find the \'price\' element, trying again later.')

def get_config(config):
    with open(config, 'r') as f:
        return json.loads(f.read())

def config_logger(debug):
    global logger
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG if debug else logging.INFO)
    handler = logging.StreamHandler()
    logger.addHandler(handler)

def get_infos(item, tree):
    title = tree.xpath(item['xpath_title'])[0].text.strip()
    item['title'] = title
    obj = {
        "title": title
    }
    with open('../logs/{}.json'.format(item['id']), 'w+') as file:
        file.write(json.dumps(obj, sort_keys=True, indent=4))


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

    args = parse_args()
    config_logger(args.debug)
    config = get_config(args.config)

    poll_interval = config["poll"]
    poll_deviation = config["poll_deviation"]
    logger.info("Configured poll intervall {} Seconds with deviation of {} Seconds.".format(poll_interval, poll_deviation))

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
            'threshold': item['threshold'],
            'price_selector': item['price_selector'],
            'xpath_price': item['xpath_price'],
            'xpath_title': item['xpath_title'],
            'xpath_img': item['xpath_img'],
            'url': urljoin(item['base_url'], item['id'])
        }

    while True:
        current_time = datetime.now().timestamp()

        for item_id, data in items.items():
            if data['next_exec'] < current_time:
                get_price(items[item_id])
                data['next_exec'] = current_time + random.randint(poll_interval - poll_deviation, poll_interval + poll_deviation)

        time.sleep(config["check_timeout"])


if __name__ == '__main__':
    main()
