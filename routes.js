/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var controller = require('./controller.js');

module.exports = function (server) {
    server.post('/add', controller.add);
    server.del('/flush', controller.flush);
    server.get(/(.*)/, controller.match);
    server.post(/(.*)/, controller.match);
};
