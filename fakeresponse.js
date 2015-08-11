/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint node:true */
'use strict';

var fs = require('fs');
var glob = require('glob');
var path = require('path');
var when = require('when');

var FakeResponse = {
    _items: [],

    preload: function(pathToConfiguration) {
        return when.promise(function(resolve, reject) {
            var configDir = pathToConfiguration || path.join(__dirname, 'default_routes');
            glob.sync('*.json', {cwd:configDir})
                .forEach(function eachFile(file) {
                    var contents = fs.readFileSync(path.join(configDir,file), 'utf8');
                    try {
                        var allRoutes = JSON.parse(contents);
                        allRoutes.routes.forEach(function(configLine) {
                            FakeResponse.add(configLine);
                        });
                    } catch(e) {
                        console.log('Wrong configuration format');
                        reject(e);
                    }
                });
            return resolve(FakeResponse.getAll());
        });
    },

    getAll: function () {
        return FakeResponse._items;
    },

    add: function (item) {
        item.numCalls = 0;
        FakeResponse._items.push(item);
    },

    flush: function () {
        FakeResponse._items = [];
    },

    /* Filters all items that match the URL and then tries to check if there is a specific behavior for the Nth call on the same endpoint */
    match: function (uri) {
        return FakeResponse._items.filter(function (item) {
            var matches = uri.match(new RegExp(item.route));

            if (matches !== null) {
                item.numCalls += 1;
                if (item.at) {
                    if (item.numCalls === item.at) {
                        return true;
                    }
                    return false;
                }
                return true;
            }
            return false;
        }).reduce(function (previous, match) {
            if (match.at || previous === 0) {
                return match;
            }
        }, 0);
    }
};

module.exports = FakeResponse;
