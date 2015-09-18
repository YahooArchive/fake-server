/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
/*jshint node:true */
/* global describe, beforeEach, it */
'use strict';

var rewire = require('rewire');
var model = rewire('../fakeresponse.js');
var assert = require('chai').assert;
var when = require('when');

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

    it('should allow user to load pre-configured routes from ./default_routes/', function (done) {
        // TODO: mock "glob" with rewire.
        model.preload().then(function () {
            assert.equal(2, model._items.length);
            var firstRoute = model.getAll()[0];
            assert.equal('/mock/0', firstRoute.route)
            assert.equal(200, firstRoute.responseCode);
            var secondRoute = model.getAll()[1];
            assert.equal('/mock/1', secondRoute.route)
            assert.equal(200, secondRoute.responseCode);
            done();
        }).catch(function(e) {
            console.log(e);
            assert.ok(false,'should not throw exceptions on a controlled test environemnt');
        });
    });

    /* POST request tests */
    it('should use payload to match against for POST requests', function() {
        model.add({
            route: '/match/me',
            payload: {
                'id': 1
            },
            responseCode: 200,
            responseBody: 'weba',
        });
        /*even though "uri"  is the same, we are only matching if payload contains id:1 */
        var response = model.match('/match/me');
        assert.equal(0, response);
     });

     it('should use payload to match against for POST requests', function() {
        var obj = {};
        model.add({
            route: '/match/me',
            payload: {
                'id': 1
            },
            responseCode: 200,
            responseBody: 'weba',
        });
        model.add({
            route: '/match/me',
            payload: {
                'id': 2
            },
            responseCode: 403,
            responseBody: 'buuu'
        });
        /*even though "uri"  is the same, we are only matching if payload contains id:1 */
        var response = model.match('/match/me', { id: 1 });
        assert.deepEqual(response.responseBody, 'weba');
        assert.deepEqual(response.responseCode, 200);
     });


     /* Query params test */
     it('should match query params', function() {
         model.add({
             route: '/match/me',
             queryParams: {
                a: 1,
                b: 2
             },
             responseCode: 200,
             responseBody: 'Query param success'
         });

         var response = model.match('/match/me?a=1&b=2');
         assert.deepEqual(response.responseCode, 200);
         assert.deepEqual(response.responseBody, 'Query param success');

         // Varying order of query params shouldn't affect matching
         response = model.match('/match/me?a=1&b=2');
         assert.deepEqual(response.responseCode, 200);
         assert.deepEqual(response.responseBody, 'Query param success');

         model.add({
             route: '/match/me',
             queryParams: {
                name: "Fabio Hirata"
             },
             responseCode: 200,
             responseBody: 'Space success'
         });

         // query params with spaces should work
         response = model.match('/match/me?name=Fabio Hirata');
         assert.deepEqual(response.responseCode, 200);
         assert.deepEqual(response.responseBody, 'Space success');

         // ...even if encoded with +
         response = model.match('/match/me?name=Fabio+Hirata');
         assert.deepEqual(response.responseCode, 200);
         assert.deepEqual(response.responseBody, 'Space success');
     });

     it('should match query params using regular expressions', function() {
         // 1. Simple regex
         model.add({
             route: '/match/me',
             queryParams: {
                a: "[0-9]"
             },
             responseCode: 200,
             responseBody: 'Regex success'
         });

         var response = model.match('/match/me?a=0');
         assert.deepEqual(response.responseCode, 200);
         assert.deepEqual(response.responseBody, 'Regex success');

         response = model.match('/match/me?a=9');
         assert.deepEqual(response.responseCode, 200);
         assert.deepEqual(response.responseBody, 'Regex success');

         response = model.match('/match/me?a=1234567890');
         assert.deepEqual(response.responseCode, 200);
         assert.deepEqual(response.responseBody, 'Regex success');

         // 2. Various other regex's
         model.add({
             route: '/match/me',
             queryParams: {
                b: "[0-9]",
                c: "[\\d+]",
                d: 1,
                e: "^(foo|bar)$"
             },
             responseCode: 200,
             responseBody: 'Regex success'
         });

         var response = model.match('/match/me?e=bar&b=12345&c=6789&d=1');
         assert.deepEqual(response.responseCode, 200);
         assert.deepEqual(response.responseBody, 'Regex success');
     });

});
