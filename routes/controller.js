/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint node:true */
'use strict';

var fs = require('fs');
var path = require('path');
var argv = require('yargs').argv;
var FakeResponse = require('./../libs/fakeresponse.js');
var ResponseDescBuilder = require('../libs/responseDescBuilder.js');
var merge = require('merge');

// Preload routes 
FakeResponse.preload(argv.configDir);

var controller = {
    fakeResponse: FakeResponse, // of course this is here just so that it can be overwritten easily in the tests.

    add: function (req, res, next) {
        var responseDesc = new ResponseDescBuilder(req.params.route)
            .withQueryParams(req.params.queryParams)
            .withHeaders(req.params.requiredHeaders)
            .withPayload(req.params.payload)
            .sendResponseBody(req.params.responseBody)
            .sendResponseCode(req.params.responseCode)
            .delayResponseBy(req.params.delay)
            .respondAtCall(req.params.at);

        controller.fakeResponse.add(responseDesc);

        res.send(200, 'OK');
        next();
    },

    match: function (req, res, next) {
        
        function send (statusCode, responseHeaders, responseBody) {
            if (typeof responseBody === "object") {
                try {
                    responseBody = JSON.stringify(responseBody);
                } catch (e) {
                    responseBody = "Unable to serialize responseBody";
                    res.statusCode = 500;
                }
            }
            responseHeaders['Content-Length'] = Buffer.byteLength(responseBody);
            res.writeHead(statusCode, responseHeaders);
            res.write(responseBody);
            res.end();
        }

        var bestMatch = controller.fakeResponse.match(req.url, req.body, req.headers);

        if (bestMatch) {
            var headers = {
                'Content-Type': 'application/json'
            };
            if(bestMatch.responseHeaders) {
                headers = merge(headers, bestMatch.responseHeaders);
            }
            if(bestMatch.responseData) {

                fs.readFile(path.join(bestMatch.responseData),'utf8', function(err, data) {
                    if (err) {
                        res.send(500, "FAKE-SERVER is misconfigured");
                    }
                    send(parseInt(bestMatch.responseCode, 10), headers, data);
                });

            } else {
                send(parseInt(bestMatch.responseCode, 10), headers, bestMatch.responseBody);
            }

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

    remove: function (req, res, next) {
        var uri = req.params.route;
        if (req.params.queryParams) {
            var allParameters = Object.keys(req.params.queryParams);
            var params = allParameters.map(function (parameterName) {
                return parameterName + '=' + req.params.queryParams[parameterName]
            }).join('&');

            uri = uri.concat('?').concat(params);
        }

        if (controller.fakeResponse.remove(uri, req.params.payload, req.params.requiredHeaders))
            res.send(200, 'OK');
        else
            res.send(409, 'NOT OK');
        next();
    },

    flush: function (req, res, next) {
        controller.fakeResponse.flush();
        res.send(200, 'OK');
        next();
    }
};

module.exports = controller;
