# Price Logger for online websites

Just a small price logger to check when an item on Amazon is cheap. Because apparently, prices on Amazon change almost daily.

Could be used for other sites aswell.

![Example](readme.png)

Controller blurred for copyright reasons.

## Installation

### Logger

```shell
logger$ sudo apt install python3-lxml
logger$ sudo apt install libopenjp2-7-dev
logger$ sudo apt install libtiff5-dev
logger$ sudo pip3 install -r requirements
```

### Visualization

```sh
visualization$ npm install --production
```

## Run

```sh
logger$ make nohup
visualization$ make nohup
```

## Config

## `logger/config.json`

```json
{
    "selectors": {
        "amazon": {
            "base_url": "https://www.amazon.de/dp/",
            "price_selector": "(\\d+,\\d\\d).*€",
            "xpath_price": "//span[@id='priceblock_ourprice']/text()",
            "xpath_avail": "//div[@id='availability']/span/text()",
            "xpath_title": "//h1[@id='title']/span/text()|//span[@id='title']/text()|//h1[@id='title']/text()",
            "xpath_img": "//img[@id='landingImage']/@data-a-dynamic-image"
        }
    },
    "items": [
        {
            "parent": "amazon",
            "id": "B073FGSC7T",
            "threshold": 34
        },
        {
            "id": "B00008XX8F",
            "threshold": 18.5,
            "base_url": "https://www.amazon.de/dp/",
            "price_selector": "(\\d+,\\d\\d).*€",
            "xpath_price": "//span[@id='priceblock_ourprice']/text()",
            "xpath_avail": "//div[@id='availability']/span/text()",
            "xpath_title": "//h1[@id='title']/span/text()|//span[@id='title']/text()|//h1[@id='title']/text()",
            "xpath_img": "//img[@id='landingImage']/@data-a-dynamic-image"        },
    ],
    "poll": 7200,
    "poll_deviation": 1800,
    "check_timeout": 60,
    "mail": {
        "smtp_url": "smtp.gmail.com",
        "smtp_port": 465,
        "from": "your-address@gmail.com",
        "password": "gmail-password",
        "to": "alerts-going-to-this@e.mail"
    },
    "user_agents": [
        "Mozilla/...",
        "Mozilla/...",
    ]
}
```

## About

I'm [Sandr0](https://twitter.com/Sandr0x00). A guy who tries to save some money while spending countless hours coding this. Check out my other repositories aswell.
