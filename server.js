/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var restify = require('restify');
var server = restify.createServer();

server.use(restify.bodyParser());

require('./routes.js')(server);

if (module.parent) { // Manhattan
    module.exports = server.server;
} else {
    server.listen(3012, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}
