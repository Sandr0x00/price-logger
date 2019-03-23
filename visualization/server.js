#!/usr/bin/env node

/* global __dirname, require, console, module, setInterval */

const express = require('express');
const compression = require('compression');
const http = require('http');
const app = express();
const port = 3001;

const fs = require('fs');
let path = require('path');

const config = loadJSON(path.join(__dirname, '..', 'logger', 'config.json'));

app.set('port', port);
app.set('view engine', 'pug');
app.locals.compileDebug = false;
app.locals.cache = true;
app.use(express.static('public'));
app.use(compression());

Object.filter = (obj, predicate) => {
    return Object.keys(obj)
        .filter(key => predicate(obj[key]))
        .reduce((res, key) => (res[key] = obj[key], res), {});
};

let json = loadLogs();
// cyclic update
setInterval(() => {
    json = loadLogs();
}, 30000);

// currently, this is not needed
// let integrity = loadJSON(path.join(__dirname, 'public', 'lib', 'integrity.json'));

app.get('/prices/:id', (req, res) => {
    setHeaders(res);
    let id = req.params.id;
    if (Object.keys(json).includes(id)) {
        res.send(json[id]);
    }
});

app.get('/img/:id', (req, res) => {
    setHeaders(res);
    let id = req.params.id;
    let img = path.join(__dirname, '..', 'logs', `${id}.jpg`);
    if (!fs.existsSync(img)) {
        res.sendFile('public/img/unknown.jpg', { root: __dirname });
    } else {
        res.sendFile(img);
    }
});

app.get('/infos/:id', (req, res) => {
    setHeaders(res);
    let id = req.params.id;
    if (Object.keys(json).includes(id) && json[id].title) {
        res.send(json[id].title);
    } else {
        res.sendStatus(500);
    }
});

app.get('/items', (req, res) => {
    setHeaders(res);
    res.send(Object.keys(json));
});

app.get('/', (req, res) => {
    setHeaders(res);
    render(res, Object.keys(json)[0]);
});

app.get('/:id', (req, res) => {
    setHeaders(res);
    render(res, req.params.id);
});

function render(res, id) {
    if (!Object.keys(json).includes(id)) {
        console.log(`render for id="${id}" requested, but missing`);
        return;
    }
    res.render('index', {
        items: Object.keys(json),
        id: id,
        base_url: config['base_url']
    });
}

const server = http.createServer(app);
server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }
    console.log(`server is listening on ${port}`);
});

function loadLogs() {
    let logs = {};
    let dirPath = path.join(__dirname, '..', 'logs');
    fs.readdirSync(dirPath).forEach(fileName => {
        let filePath = path.join(dirPath, fileName);
        let stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            console.log('There should be no directory here!');
            return;
        }
        let file = path.parse(fileName);
        let key = file.name;
        if (file.ext != '.txt') {
            return;
        }
        let fileContent = fs.readFileSync(filePath, 'utf8').split('\n');
        let content = [];
        fileContent.forEach(row => {
            if (row.length == 0) {
                return;
            }
            row = row.split(' - ');
            content.push({
                'time': Date.parse(row[0]),
                'price': row[1]
            });
        });
        logs[key] = {};
        logs[key].prices = content;
        logs[key].id = key;
        // try to add additional infos
        let infos = loadJSON(path.join(__dirname, '..', 'logs', `${key}.json`));
        if (infos) {
            logs[key] = Object.assign(infos, logs[key]);
        }
    });
    return logs;
};


function setHeaders(res) {
    res.set('X-XSS-ProtectionType', '"1; mode=block"');
    res.set('X-Frame-Options', 'SAMEORIGIN');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Strict-Transport-Security', '"max-age=31536000; includeSubDomains; preload"');
    res.set('Content-Security-Policy',
        'default-src \'self\';'
        + 'img-src \'self\';'
        + 'style-src \'self\' \'unsafe-inline\' use.fontawesome.com;'
        + 'script-src \'self\' \'unsafe-inline\';'
        + 'font-src use.fontawesome.com;'
        + 'require-sri-for script style;');
    res.set('X-Permitted-Cross-Domain-Policies', '"none"');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Feature-Policy', 'accelerometer \'none\'; camera \'none\'; geolocation \'none\'; gyroscope \'none\'; magnetometer \'none\'; microphone \'none\'; payment \'none\'; usb \'none\'; sync-xhr \'none\'');
}

function loadJSON(p) {
    if (!fs.existsSync(p)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}