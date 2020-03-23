#!/usr/bin/env node

/* global __dirname, require */

const express = require('express');
const compression = require('compression');
const http = require('http');
const app = express();
const port = 8084;

const fs = require('fs');
let path = require('path');

const process = require('process');

if (process.pid) {
    // save PID for "make kill"
    fs.writeFile('pid', process.pid, err => {
        if (err) {
            throw err;
        }
    });
}

const config = loadJSON(path.join(__dirname, '..', 'logger', 'config.json'));

app.set('port', port);
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
    if (Object.keys(json).includes(id)) {
        let img = path.join(__dirname, '..', 'logs', `${id}.jpg`);
        if (fs.existsSync(img)) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.sendFile(img);
            return;
        }
    }
    sendUnknownImg(res);
});

app.get('/placeholder/:id', (req, res) => {
    setHeaders(res);
    let id = req.params.id;
    if (Object.keys(json).includes(id)) {
        let img = path.join(__dirname, '..', 'logs', `${id}.thumbnail`);
        if (fs.existsSync(img)) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.sendFile(img);
            return;
        }
    }
    sendUnknownImg(res);
});

function sendUnknownImg(res) {
    res.sendFile('public/img/unknown.jpg', { root: __dirname });
}

app.get('/infos/:id', (req, res) => {
    setHeaders(res);
    let id = req.params.id;
    if (Object.keys(json).includes(id) && json[id].title) {
        let active = false;
        if (config['items'].find(item => item.id == id)) {
            active = true;
        }

        res.send({
            title: json[id].title,
            active: active
        });
    } else if (Object.keys(json).includes(id)) {
        let active = false;
        if (config['items'].find(item => item.id == id)) {
            active = true;
        }

        res.send({
            title: id,
            active: active
        });
    } else {
        res.sendStatus(500);
    }
});


const exec = require('child_process').exec;

app.get('/status', (req, res) => {
    setHeaders(res);
    exec('ps -ef | grep [l]ogger', (error, stdout) => {
        let status = stdout ? true : false;
        res.send({
            'status': status
        });
    });
});


app.get('/items', (req, res) => {
    setHeaders(res);
    res.send(Object.keys(json));
});

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
}


function setHeaders(res) {
    res.setHeader('X-XSS-ProtectionType', '"1; mode=block"');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', '"max-age=31536000; includeSubDomains; preload"');
    res.setHeader('Content-Security-Policy',
        'default-src \'self\';'
        + 'img-src \'self\';'
        + 'style-src \'self\' \'unsafe-inline\' use.fontawesome.com;'
        + 'script-src \'self\' \'unsafe-inline\';'
        + 'font-src use.fontawesome.com;'
        + 'require-sri-for script style;');
    res.setHeader('X-Permitted-Cross-Domain-Policies', '"none"');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Feature-Policy', 'accelerometer \'none\'; camera \'none\'; geolocation \'none\'; gyroscope \'none\'; magnetometer \'none\'; microphone \'none\'; payment \'none\'; usb \'none\'; sync-xhr \'none\'');
}

function loadJSON(p) {
    if (!fs.existsSync(p)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}