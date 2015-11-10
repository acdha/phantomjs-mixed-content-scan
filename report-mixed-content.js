#!/usr/bin/env phantomjs --disk-cache=true --ignore-ssl-errors=false --load-images=true --output-encoding=utf-8
'use strict';

var system = require('system'),
    webpage = require('webpage');

var args = system.args,
    URLs = [];

args.slice(1).forEach(function(url) {
    if (url.substr(0, 8) !== 'https://') {
        console.error('Skipping insecure URL:', url);
    } else {
        URLs.push(url);
    }
});

if (URLs.length < 2) {
    console.log('Usage:', args[0], 'URL [URL2]');
    phantom.exit(1);
}

function crawlNext() {
    var url;

    if (URLs.length > 0) {
        url = URLs.pop();
    } else {
        console.log('… done');
        phantom.exit();
    }

    console.log('Crawling', url);

    var page = webpage.create();

    page.onResourceReceived = function (response) {
        if (response.stage == 'start') {
            if (response.url.substr(0, 8) !== 'https://' && response.url.substr(0, 5) !== 'data:') {
                console.log('❗️ ', url, 'loaded an insecure resource:', response.url);
            }
        }
    };

    page.open(url, function(status) {
        if (status === 'success') {
            console.log('✅ ', url);
        } else {
            console.log('❌ ', url);
        }

        page.close();

        crawlNext();
    });
}

crawlNext();