# Description

Just a small price logger to check when an item on Amazon is cheap. Because apparently, prices on Amazon change almost daily.

Could be used for other sites aswell.


# Scripts

## Locally

### Logger
```shell
logger$ npm run install
logger$ npm run start
```

### Visualization
```shell
visualization$ npm run build:dev
visualization$ npm start
```

## Deploy to production

### Logger
```shell
logger$ npm run build
logger$ npm run deploy:copy
logger$ npm run deploy:install
```

### Visualization
```shell
visualization$ npm run build:prod
visualization$ npm run deploy:copy
visualization$ npm run deploy:install
```


# Config

## `logger/config.json`

```json
{
    "base_url": "https://www.amazon.de/dp/",
    "price_selector": "EUR \\d+,\\d\\d",
    "items": [
        {
            "id": "B073FGSC7T",
            "threshold": 39
        },
        {
            "id": "B00008XX8F",
            "threshold": 18.5
        },
        ...
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
    }
}
```

# About

I'm [Sandr0x00](https://twitter.com/Sandr0x00). Check out my other repositories aswell.