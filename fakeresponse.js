/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var FakeResponse = {
    _items: [],

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
