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
import urllib
import mail

def log_price(item_id: str, price):
    current_time = datetime.now().isoformat()
    logger.info('{} - {} - {:.2f}'.format(current_time, item_id, price))
    with open('../logs/{}.txt'.format(item_id), 'a+') as file:
        file.write("{} - {:.2f}\n".format(current_time, price))


def get_price(item):
    try:
        r = requests.get(items[item]['url'], headers={
            'User-Agent':
                'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:65.0) Gecko/20100101 Firefox/65.0'
        })
        r.raise_for_status()
        tree = html.fromstring(r.text)
        # extract the price from the string
        price = re.findall(config['price_selector'], tree.xpath("//*[@id='priceblock_ourprice']")[0].text)[0]
        if not os.path.isfile('../logs/{}.jpg'.format(item)):
            get_image(item, tree)
        # we found the price, now cut "EUR " and parse english format
        price_f = float(price[4:].replace(',', '.'))
        log_price(item, price_f)
        if price_f < items[item]['threshold']:
            mail.send_mail(config['mail'], item, price_f)
    except requests.exceptions.RequestException as e:
        logger.debug(e)
        mail.send_error(config['mail'], e)
        logger.warning('Can\'t connect, trying again later.')
    except (IndexError, TypeError) as e:
        logger.debug(e)
        mail.send_error(config['mail'], e)
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

def get_image(item, tree):
    img = tree.xpath("//img[@id='landingImage']/@data-a-dynamic-image")[0]
    obj = json.loads(img)
    image_url = list(obj.keys())[0]
    urllib.request.urlretrieve(image_url, "../logs/{}.jpg".format(item))

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
    global items

    args = parse_args()
    config_logger(args.debug)
    config = get_config(args.config)

    poll_interval = config["poll"]
    poll_deviation = config["poll_deviation"]
    logger.info("Configured poll intervall {} Seconds with deviation of {} Seconds.".format(poll_interval, poll_deviation))

    # build intervall list
    # {
    #   "id": {
    #     "next_exec": "next execution time",
    #     "threshold": "threshold for email",
    #     "url": "item url"
    #   }, ...
    # }
    items = {}
    for item in config['items']:
        initial_delay = random.randint(0, poll_interval)
        current_time = datetime.now().timestamp()
        items[item['id']] = {
            'next_exec': current_time + initial_delay,
            'threshold': item['threshold'],
            'url': urljoin(config['base_url'], item['id'])
        }

    while True:
        current_time = datetime.now().timestamp()

        for item_id, data in items.items():
            if data['next_exec'] < current_time:
                get_price(item_id)
                data['next_exec'] = current_time + random.randint(poll_interval - poll_deviation, poll_interval + poll_deviation)

        time.sleep(config["check_timeout"])


if __name__ == '__main__':
    main()
