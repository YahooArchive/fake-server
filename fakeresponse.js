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
var url = require('url');

var FakeResponse = {
    _items: [],

    preload: function(pathToConfiguration) {
        return when.promise(function(resolve, reject) {
            var configDir = pathToConfiguration || path.join(__dirname, 'default_routes');
            console.log('loading config from: ',configDir);
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
    match: function (uri, payload) {
        uri = url.parse(uri, true);

        return FakeResponse._items.filter(function (item) {
            var doPathsMatch = uri.pathname.match(new RegExp(item.route));

            if (doPathsMatch !== null) {
                item.numCalls += 1;
                if(item.queryParams && !FakeResponse.matchQueryParams(item, uri.query)) return false;
                if(item.payload && !FakeResponse.matchPayload(item, payload)) return false; 
                if (item.at) {
                    return (item.numCalls === item.at); 
                }
                return true;
            }
            return false;
        }).reduce(function (previous, match) {
            if (match.at || previous === 0) {
                return match;
            }
        }, 0);
    },

    matchPayload: function(item, payload) {
        if (typeof(payload) !== "object" || typeof(item.payload) !== "object") return false;
        for (var ppty in item.payload) {
            if (!item.payload.hasOwnProperty(ppty) || !payload.hasOwnProperty(ppty)) return false;
            if (item.payload[ppty] !== payload[ppty]) return false;
        }
        return true;
    },

    matchQueryParams: function(item, queryParams) {
        if (typeof(queryParams) !== "object" || typeof(item.queryParams) !== "object") return false;

        for (var ppty in item.queryParams) {
            if (!item.queryParams.hasOwnProperty(ppty) || !queryParams.hasOwnProperty(ppty)) return false;

            if (typeof(item.queryParams[ppty]) === 'string' ) {
                // Evalute regex match
                var queryMatches = queryParams[ppty].match(new RegExp(item.queryParams[ppty]));
                if (queryMatches == null) return false;
            } else {
                // Or evalute exact property match
                if (item.queryParams[ppty] != queryParams[ppty]) return false;
            }
        }
        return true;
    }
};

module.exports = FakeResponse;
