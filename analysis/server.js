#!/usr/bin/env node

/* global __dirname, require, console, module */

const express = require('express');
const http = require('http');
const app = express();
const port = 5000;


const fs = require('fs');
let path = require('path');

app.set('view engine', 'pug');
app.locals.compileDebug = false;
app.locals.cache = true;
app.use(express.static('public'));


Object.filter = (obj, predicate) => {
    return Object.keys(obj)
          .filter(key => predicate(obj[key]))
          .reduce((res, key) => (res[key] = obj[key], res), {});
};

let json = loadLogs();
// console.log(json);

app.set('port', port);

let d3 = '/js/d3.min.js';

app.get('/api/:id', (req, res) => {
    setHeaders(res);
    let id = req.params.id;
    if (Object.keys(json).includes(id)) {
        res.send(json[id]);
    }
});


app.get('/', (req, res) => {
    setHeaders(res);
    res.render('index', {
        d3: d3,
        items: Object.keys(json)
    });
});


app.get('/:id', (req, res) => {
    setHeaders(res);
    let id = req.params.id;
    res.render('item', {
        d3: d3,
        id: id,
        prices: json[id]
    });
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
            return null;
        }
        let key = path.parse(fileName).name;
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
        logs[key] = content;
        logs[key].id = key;
    });
    return logs;
};


function setHeaders(res) {
    // res.set('X-XSS-ProtectionType', '"1; mode=block"');
    // res.set('X-Frame-Options', 'SAMEORIGIN');
    // res.set('X-Content-Type-Options', 'nosniff');
    // res.set('Strict-Transport-Security', '"max-age=31536000; includeSubDomains; preload"');
    // res.set('Content-Security-Policy', 'default-src \'none\'; img-src \'self\'; style-src \'self\' stackpath.bootstrapcdn.com use.fontawesome.com; script-src \'self\' maxcdn.bootstrapcdn.com cdnjs.cloudflare.com code.jquery.com; font-src use.fontawesome.com');
    // res.set('X-Permitted-Cross-Domain-Policies', '"none"');
    // res.set('Referrer-Policy', 'no-referrer');
    // res.set('Feature-Policy', 'accelerometer \'none\'; camera \'none\'; geolocation \'none\'; gyroscope \'none\'; magnetometer \'none\'; microphone \'none\'; payment \'none\'; usb \'none\'; sync-xhr \'none\'');
}