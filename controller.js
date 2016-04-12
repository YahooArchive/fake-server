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
var FakeResponse = require('./fakeresponse.js');
var merge = require('merge');

// Preload routes
FakeResponse.preload(argv.configDir);

var controller = {
    fakeResponse : FakeResponse, // of course this is here just so that it
    // can be overwritten easily in the tests.

    add : function(req, res, next) {
        var obj = {
            verb : req.params.verb,
            delay : req.params.delay,
            at : req.params.at,
            route : req.params.route,
            queryParams : req.params.queryParams,
            payload : req.params.payload,
            responseCode : req.params.responseCode,
            responseBody : decodeURIComponent(req.params.responseBody.replace(
                    /&quot;/g, '"')),
        };

        controller.fakeResponse.add(obj);

        res.send(200, 'OK');
        next();
    },

    howto : function(req, res, next) {
        
        var headers = {
                'Content-Type' : 'text/html'
            };

        function send(statusCode, responseHeaders, responseBody) {

            responseHeaders['Content-Length'] = Buffer.byteLength(responseBody);
            res.writeHead(statusCode, responseHeaders);
            res.write(responseBody);
            res.end();
        }

        fs.readFile(path.join(__dirname, "./README2.html"), 'utf8', function(err,
                data) {
            if (err) {
                res.send(500, "FAKE-SERVER is misconfigured");
            }
            send(200, headers, data);
        });

        next();
    },

    delOne : function(req, res, next) {
    	

        var bestMatch = controller.fakeResponse.match(true, req, res);

        if (bestMatch) {
            res.send(410, 'GONE');
        } else {
            res.send(404, 'NOT FOUND!');
        }
        next();
    },

    getAll : function(req, res, next) {
        var obj = controller.fakeResponse.getAll(obj);

        res.send(200, obj);
        next();
    },

    match : function(req, res, next) {

        function send(statusCode, responseHeaders, responseBody) {
            
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

        var bestMatch = controller.fakeResponse.match(false, req, res);

        if (bestMatch) {
            var headers = {
                'Content-Type' : 'application/json'
            };
            if (bestMatch.responseHeaders) {
                headers = merge(headers, bestMatch.responseHeaders);
            }
            if (bestMatch.responseData) {
                

                fs.readFile(path.join(__dirname, bestMatch.responseData),
                        'utf8', function(err, data) {
                            if (err) {
                                res.send(500, "FAKE-SERVER is misconfigured");
                            }
                            send(parseInt(bestMatch.responseCode, 10), headers,
                                    data);
                        });

            } else {
                send(parseInt(bestMatch.responseCode, 10), headers,
                        bestMatch.responseBody);
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

    flush: function (req, res, next) {
        controller.fakeResponse.flush();
        res.send(200, 'OK');
        next();
    }
};

module.exports = controller;
