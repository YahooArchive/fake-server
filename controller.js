/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var FakeResponse = require('./fakeresponse.js');

var controller = {
    fakeResponse: FakeResponse, // of course this is here just so that it can be overwritten easily in the tests.

    add: function (req, res, next) {
        var obj = {
            delay: req.params.delay,
            at: req.params.at,
            route: req.params.route,
            responseCode: req.params.responseCode,
            responseBody: decodeURIComponent(req.params.responseBody.replace(/&quot;/g, '"')),
        };

        controller.fakeResponse.add(obj);

        res.send(200, 'OK');
        next();
    },

    match: function (req, res, next) {
        var bestMatch = controller.fakeResponse.match(req.url);

        if (bestMatch) {
            res.setHeader('Content-type', 'text/plain'); // overwrites default octetstream header.
            res.send(parseInt(bestMatch.responseCode, 10), bestMatch.responseBody);

            if (bestMatch.delay) {
                setTimeout(next, bestMatch.delay);
            } else {
                next();
            }
        } else {
            res.send(404, 'no match!');
            next();
        }
    },

    flush: function (req, res, next) {
        controller.fakeResponse.flush();
        res.send(200, 'OK');
        next();
    }
};

module.exports = controller;
