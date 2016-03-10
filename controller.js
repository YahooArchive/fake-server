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
var restify = require('restify');

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

		function send(statusCode, responseHeaders, responseBody) {

//			try {
//				responseBody = JSON.stringify(responseBody);
//			} catch (e) {
//				responseBody = "Unable to serialize responseBody";
//				res.statusCode = 500;
//			}
			responseHeaders['Content-Length'] = Buffer.byteLength(responseBody);
			res.writeHead(statusCode, responseHeaders);
			res.write(responseBody);
			res.end();
		}

		fs.readFile(path.join(__dirname, "./README.md"), 'utf8', function(err,
				data) {
			if (err) {
				res.send(500, "FAKE-SERVER is misconfigured");
			}
			send(parseInt(200, 10), headers, data);
		});

		res.send(200, 'OK');
		next();
	},

	delOne : function(req, res, next) {
		var obj = {
			route : req.params.route,
			verb : req.params.verb,
			responseCode : req.params.responseCode,
		};

		var bestMatch = controller.fakeResponse.matchDel(obj.route,
				obj.responseCode, obj.verb);

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

		var bestMatch = controller.fakeResponse.match(req.url, req.body,
				req.headers, req.method);

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

	flush : function(req, res, next) {
		var autorized = {
			username : "crodriguez",
			password : "crodriguez"
		};
		var obj = {
			username : req.params.username,
			password : req.params.password,
		};
		console.log("flush( username=" + obj.username + ", password="
				+ obj.password + ")");
		if (obj.username == autorized.username) {
			if (obj.password == autorized.password) {
				controller.fakeResponse.flush();
				res.send(200, 'OK');
				return next();
			}
		} else {
			res.send(401, 'Unauthorized!!!');
			return next(new restify.ConflictError("I just don't like you"));
		}

	}
};

module.exports = controller;
