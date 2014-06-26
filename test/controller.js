/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint -W079 */
'use strict';

var controller = require('../controller.js');
var sinon = require('sinon');
var assert = require('chai').assert;

describe('Integration tests', function () {
    beforeEach(function () {
        controller.fakeResponse.flush();
    });

    it('should provide a way to add new responses for a given endpoint', function () {
        var req = {
            params: {
                route: '/foo/bar',
                responseCode: '404',
                responseBody: 'Not found, tche!',
            }
        };
        var res = {
            send: sinon.stub(),
        };

        sinon.stub(controller.fakeResponse, 'add');

        controller.add(req, res, function () {});

        assert.isTrue(controller.fakeResponse.add.calledOnce);

        controller.fakeResponse.add.restore();
    });

    it('should have a way to wipe out the whole data', function () {
        var req = {
            params: {
                route: '/foo/bar',
                responseCode: '404',
                responseBody: 'Not found, tche!'
            }
        };
        var res = {
            send: sinon.stub(),
        };

        sinon.stub(controller.fakeResponse, 'flush');

        controller.add(req, res, function () {});
        controller.add(req, res, function () {});

        controller.flush(null, res, function () {});

        assert.isTrue(controller.fakeResponse.flush.calledOnce);

        controller.fakeResponse.flush.restore();
    });

    it('should allow different behaviours for the same request based on the number of requests', function () {
        var responses = [{
            route: '/',
            responseCode: 200,
            responseBody: 'OK',
            numCalls: 0
        }, {
            route: '/',
            responseCode: 403,
            responseBody: 'yay!',
            at: 3,
            numCalls: 0
        }];

        var req = {
            url: '/'
        };

        var res = {
            send: sinon.stub(),
            setHeader: sinon.stub(),
        };

        controller.fakeResponse._items = responses;

        controller.match(req, res, function () {});
        res.send.lastCall.calledWithExactly(200, 'OK');

        controller.match(req, res, function () {});
        res.send.lastCall.calledWithExactly(200, 'OK');

        controller.match(req, res, function () {});
        res.send.lastCall.calledWithExactly(403, 'yay!');

        controller.match(req, res, function () {});
        res.send.lastCall.calledWithExactly(200, 'OK');
    });

    it('should replace incoming &quot; by " so un-encoded quotes are returned', function () {
        var req = {
            params: {
                route: '/',
                responseCode: 200,
                responseBody: '{&quot;json&quot;: &quot;string look-a-like&quot;}',
            }
        };
        var res = {
            send: sinon.stub(),
        };

        sinon.stub(controller.fakeResponse, 'add');

        controller.add(req, res, function () {});

        assert.isTrue(controller.fakeResponse.add.calledWithMatch({
            route: '/',
            responseCode: 200,
            responseBody: '{"json": "string look-a-like"}',
        }));

        controller.fakeResponse.add.restore();
    });

    it('should delay response by specified milliseconds', function (done) {
        var delay = 1000,
            clock = sinon.useFakeTimers(new Date().getTime()),
            next = sinon.stub(),
            req = {
                params: {
                    delay: delay,
                    route: '/delayed',
                    responseCode: 200,
                    responseBody: 'OK',
                }
            },
            res = {
                send: sinon.stub(),
                setHeader: sinon.stub(),
            };

        controller.add(req, res, function () {});

        controller.match({
            url: '/delayed',
        }, res, next);

        clock.tick(delay - 1);

        assert.isTrue(next.notCalled, 'next should not be called before specified delay');

        clock.tick(delay + 1);

        assert.isTrue(next.calledOnce);

        clock.restore();
        done();
    });
});
