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

if (URLs.length < 1) {
    console.log('Usage:', args[0], 'URL [URL2]');
    phantom.exit(1);
}

function initPage() {
    var page = new WebPage();

    page.onResourceRequested = function(requestData, networkRequest) {
        var originalURL = requestData.url;
        if (originalURL.match(/^http:\/\/cdn\.loc\.gov/)) {
            var newURL = originalURL.replace('http://cdn.loc.gov', 'https://cdn.loc.gov');
            networkRequest.changeUrl(newURL);
        }
    };

    page.onError = function (msg, trace) {
        logError('🌋 Page error:', msg);
        trace.forEach(function(item) {
            logError('  ', item.file, ':', item.line);
        });
    };

    page.onConsoleMessage = function(msg) {
        if (msg == 'GOTO_NEXT_PAGE') {
            page.close();
            crawlNextPage();
        } else {
            console.log('\t💻', msg);
        }
    };

    return page;
}

function crawlNextPage() {
    if (URLs.length < 1) {
        console.log('… done!');
        phantom.exit();
    }

    var url = URLs.shift();
    var page = initPage();

    page.onResourceReceived = function (response) {
        if (response.stage == 'start') {
            if (response.url.substr(0, 8) !== 'https://' && response.url.substr(0, 5) !== 'data:') {
                console.log('❗️ ', url, 'loaded an insecure resource:', response.url);
            }
        }
    };

    console.log('Opening', url, '(' + URLs.length + ' remaining)');

    page.onInitialized = function() {
        page.evaluate(function(startTime) {
            /* global window */

            window.addEventListener('load', function() {
                window.setTimeout(function () {
                    console.log('GOTO_NEXT_PAGE');
                }, 500);
            });

            window.setTimeout(function () {
                console.log('👎 Aborting page load after one minute');
                console.log('GOTO_NEXT_PAGE');
            }, 60 * 1000);

        }, Date.now());
    };

    page.open(url, function (status) {
        if (status === 'success') {
            console.log('✅ ', url);
            // Do nothing at this point until the load event fires
        } else {
            console.log('❌ ', url);

            page.close();
            crawlNext();
        }
    });
}

crawlNextPage();
