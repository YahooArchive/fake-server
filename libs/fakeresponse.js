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
var _ = require('lodash');

var FakeResponse = {
    _items: [],

    preload: function (pathToConfiguration) {
        return when.promise(function (resolve, reject) {
            var configDir = pathToConfiguration || require(path.join(__dirname, '../config.json')).DEFAULT_ROUTES_PATH;
            console.log('loading config from: ', configDir);
            glob.sync('*.json', {cwd: configDir})
                .forEach(function eachFile(file) {
                    var contents = fs.readFileSync(path.join(configDir, file), 'utf8');
                    try {
                        var allRoutes = JSON.parse(contents);
                        allRoutes.routes.forEach(function (configLine) {
                            FakeResponse.add(configLine);
                        });
                    } catch (e) {
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
        item.timestamp = new Date().getTime();
        FakeResponse._items.push(item);
    },

    remove: function (url, payload, headers) {
        var bestMatch = FakeResponse.match(url, payload, headers);
        var bestMatchIndex = FakeResponse._items.indexOf(bestMatch);

        if (bestMatchIndex != -1) {
            var numberOfElementToRemove = 1;
            FakeResponse._items.splice(bestMatchIndex, numberOfElementToRemove);
            return true;
        } else
            return false;
    },

    flush: function () {
        FakeResponse._items = [];
    },

    /*Lexicographic comparison based on: (at, num query + payload params matched, num headers matched)*/
    compareMatches: function (matchA, matchB) {
        /*First rank on 'at' match*/
        if (!matchA.hasOwnProperty('at') && matchB.hasOwnProperty('at')) {
            return 1;
        }
        if (matchA.hasOwnProperty('at') && !matchB.hasOwnProperty('at')) {
            return -1;
        }

        /*Second rank on quality of 'params' match*/
        var numParamsMatchedB = Object.keys(matchB.queryParams || {}).length +
            Object.keys(matchB.payload || {}).length;
        var numParamsMatchedA = Object.keys(matchA.queryParams || {}).length +
            Object.keys(matchA.payload || {}).length;
        var queryCmp = numParamsMatchedB - numParamsMatchedA;
        if (queryCmp !== 0) {
            return queryCmp;
        }

        /*Third rank on the number of 'headers' match*/
        var numHeadersMatchedB = Object.keys(matchB.requiredHeaders || {}).length;
        var numHeadersMatchedA = Object.keys(matchA.requiredHeaders || {}).length;
        var headerCmp = numHeadersMatchedB - numHeadersMatchedA;
        if(0 !== headerCmp)
            return headerCmp;

        /*If still tied, rank on latest response*/
        return matchB.timestamp - matchA.timestamp;
    },


    /* Filters all items that match the URL and then tries to check if there is a specific behavior for the Nth call on the same endpoint */
    match: function (uri, payload, headers) {
        uri = url.parse(uri, true);

        return FakeResponse._items.filter(function (item) {
                var doPathsMatch = uri.pathname.match(new RegExp(item.route));

                if (doPathsMatch !== null) {
                    item.numCalls += 1;
                    if (item.queryParams && !FakeResponse.matchRegex(item.queryParams, uri.query)) return false;
                    if (item.payload && !FakeResponse.matchRegex(item.payload, payload)) return false;
                    if (item.requiredHeaders && !FakeResponse.matchRegex(item.requiredHeaders, headers)) return false;
                    if (item.at) return (item.numCalls === item.at);
                    return true;
                }
                return false;
            }).sort(FakeResponse.compareMatches)[0] || null;
    },

    /*
     * Match objB's values against regular expressions stored in objA. Key equality determines values to test.
     * @param {objA} An object whose string values represent regular expressions
     * @param {objB} An object whose values will be matched against objA's values
     * @return {boolean} If objB matches all regular expressions
     */
    matchRegex: function (objA, objB) {
        if (typeof(objB) !== "object" || typeof(objA) !== "object") return false;

        return Object.keys(objA).every(function (path) {
            var value = _.get(objB, path);
            if (!value) return false;

            // Evalute regex match
            var matches = String(value).match(new RegExp(objA[path]));
            return matches;
        });
    }
};

module.exports = FakeResponse;
