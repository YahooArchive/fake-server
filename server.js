/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';
var path = require('path');

var restify = require('restify');
var server = restify.createServer();

server.use(restify.bodyParser());

require('./routes/routes.js')(server);

const PORT = require(path.join(__dirname, 'config.json')).PORT;

if (module.parent) { // Manhattan
    module.exports = server.server;
} else {
    server.listen(PORT, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}
