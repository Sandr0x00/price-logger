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

def log_price(item_id: str, price):
    current_time = datetime.now().isoformat(timespec='minutes')
    logger.info('{} - {} - {:.2f}'.format(current_time, item_id, price))
    with open('../logs/{}.txt'.format(item_id), 'a+') as file:
        file.write("{} - {:.2f}\n".format(current_time, price))


def get_price(item):
    url = urljoin(config['base_url'], item)
    r = requests.Session().get(url, headers={
        'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
            '(KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
    })
    r.raise_for_status()
    tree = html.fromstring(r.text)
    try:
        # extract the price from the string
        price_string = re.findall('\d+.\d+', tree.xpath(selector)[0].text)[0]
        price = float(price_string.replace(',', '.'))
        log_price(item, price)
    except (IndexError, TypeError) as e:
        logger.debug(e)
        logger.warning('Didn\'t find the \'price\' element, trying again later')


def get_config(config):
    with open(config, 'r') as f:
        return json.loads(f.read())


def config_logger(debug):
    global logger
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG if debug else logging.INFO)
    handler = logging.StreamHandler()
    logger.addHandler(handler)


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
    global selector
    args = parse_args()
    config_logger(args.debug)
    config = get_config(args.config)
    selector = config['xpath_selector']

    poll_interval = config["poll"]
    poll_deviation = config["poll_deviation"]
    check_timeout = config["check_timeout"]
    logger.info("Configured poll intervall {} Seconds with deviation of {} Seconds.".format(poll_interval, poll_deviation))

    # build intervall list { "id": "next execution" }
    items = {}
    for item in config['items']:
        initial_delay = random.randint(0, poll_interval)
        current_time = datetime.now().timestamp()
        items[item] = current_time + initial_delay

    while True:
        current_time = datetime.now().timestamp()

        for item, next_exec in items.items():
            if next_exec < current_time:
                get_price(item)
                items[item] = current_time + random.randint(poll_interval - poll_deviation, poll_interval + poll_deviation)

        time.sleep(check_timeout)


if __name__ == '__main__':
    main()
