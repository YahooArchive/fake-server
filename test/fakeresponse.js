/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

'use strict';

var model = require('../fakeresponse.js');
var assert = require('chai').assert;

describe('FakeResponse model tests', function () {
    beforeEach(function () {
        model._items = [];
    });

    it('should add new items to the list of fake responses', function () {
        assert.equal(0, model.getAll().length, 'should start empty');
        model.add({
            route: '/foo/bar',
            responseCode: 404,
            responseBody: 'foo',
        });

        assert.equal(1, model.getAll().length);
    });

    it('should have a flush method to wipe out every item added so far', function () {
        assert.equal(0, model.getAll().length, 'should start empty');

        model.add({});
        model.add({});

        assert.equal(2, model.getAll().length);

        model.flush();

        assert.equal(0, model.getAll().length);

    });


    it('should match successfully a route with the expected answers', function () {
        var obj = {
            route: '/foo/bar',
            responseCode: 200,
            responseBody: 'foo',
        };

        model.add({
            route: '/i/don/t/want/this',
            responseCode: 403,
            responseBody: '§xxx',
        });

        model.add(obj);

        var response = model.match('/foo/bar');

        assert.deepEqual(response, obj);
    });

    it('should match based on regexp', function () {
        var obj = {
            route: '/foo.*',
            responseCode: 200,
            responseBody: 'foo',
        };

        model.add(obj);

        model.add({
            route: '/i/don/t/want/this',
            responseCode: 403,
            responseBody: '§xxx',
        });

        var response = model.match('/foo/bar');

        assert.deepEqual(response, obj);
    });

    it('should change behavior based on the AT property of the item', function () {
        model.add({
            route: '/i/don/t/want/this',
            responseCode: 403,
            responseBody: '§xxx',
        });

        model.add({
            route: '/match/me',
            responseCode: 200,
            responseBody: 'weba',
        });

        model.add({
            route: '/match/me',
            responseCode: 204,
            responseBody: 'it worked',
            at: 2
        });

        var firstReq = model.match('/match/me');
        assert.equal(200, firstReq.responseCode);
        var secondReq = model.match('/match/me');
        assert.equal(204, secondReq.responseCode);
        var thirdReq = model.match('/match/me');
        assert.equal(200, thirdReq.responseCode);

    });

});
