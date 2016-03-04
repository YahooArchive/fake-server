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

    
    delOne: function (item) {
        item.numCalls = 0;
        FakeResponse._items.push(item);
    },
    
    flush: function () {
        FakeResponse._items = [];
    },

    /*Lexicographic comparison based on: (at, num query + payload params matched, num headers matched)*/
    compareMatches: function(matchA, matchB) {
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

        /*If still tied, rank on quality of 'headers' match*/
        return Object.keys(matchB.requiredHeaders || {}).length - Object.keys(matchA.requiredHeaders || {}).length;
    },


    /* Filters all items that match the URL and then tries to check if there is a specific behavior for the Nth call on the same endpoint */
    match: function (uri, payload, headers) {
        uri = url.parse(uri, true);

        return FakeResponse._items.filter(function (item) {
            var doPathsMatch = uri.pathname.match(new RegExp(item.route));

            if (doPathsMatch !== null) {
                item.numCalls += 1;
                if(item.queryParams && !FakeResponse.matchRegex(item.queryParams, uri.query)) return false;
                if(item.payload && !FakeResponse.matchRegex(item.payload, payload)) return false;
                if(item.requiredHeaders && !FakeResponse.matchRegex(item.requiredHeaders, headers)) return false;
                if (item.at) return (item.numCalls === item.at);
                return true;
            }
            return false;
        }).sort(FakeResponse.compareMatches)[0] || null;
    },
    
    /* Filters all items that match the URL and then tries to check if there is a specific behavior for the Nth call on the same endpoint */
    matchDel: function (route, responseCode, verb) {
        uri = url.parse(route, true);

        return FakeResponse._items.filter(function (item) {
            var doPathsMatch = uri.pathname.match(new RegExp(item.route));

            if (doPathsMatch !== null) {
                if(item.responseCode && !FakeResponse.matchRegex(item.responseCode, responseCode)) return false;
                if(item.verb && !FakeResponse.matchRegex(item.verb, verb)) return false;
                var index  = FakeResponse._items.indexOf(item);
                if (index > -1) {
                    array.splice(index, 1);
                    return true;
                }else{
                	 return false;
                }
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
    matchRegex: function(objA, objB) {
        if (typeof(objB) !== "object" || typeof(objA) !== "object") return false;

        return Object.keys(objA).every(function(path) {
            var value = _.get(objB, path);
            if (!value) return false;

            // Evalute regex match
            var matches = String(value).match(new RegExp(objA[path]));
            return matches;
        });
    }
};

module.exports = FakeResponse;
