/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint -W079 */
'use strict';

var controller = require('../routes/controller.js');
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
                responseHeaders: {'Access-Control-Allow-Origin': 'http://localhost:3012'}
            }
        };
        var res = {
            send: sinon.stub(),
        };

        sinon.stub(controller.fakeResponse, 'add');

        controller.add(req, res, function () {});

        assert.isTrue(controller.fakeResponse.add.calledOnce);
        assert.isTrue(controller.fakeResponse.add.calledWith(sinon.match({
            route: '/foo/bar',
            responseCode: '404',
            responseBody: 'Not found, tche!',
            responseHeaders: {'Access-Control-Allow-Origin': 'http://localhost:3012'}
        })));

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
            write: sinon.stub(),
            writeHead: sinon.stub(),
            end: sinon.stub()
        };

        controller.fakeResponse._items = responses;

        controller.match(req, res, function () {});
        res.writeHead.lastCall.calledWithExactly(200,  {'Content-Type' : 'application/json'});
        res.write.lastCall.calledWithExactly('OK');

        controller.match(req, res, function () {});
        res.writeHead.lastCall.calledWithExactly(200,  {'Content-Type' : 'application/json'});
        res.write.lastCall.calledWithExactly('OK');

        controller.match(req, res, function () {});
        res.writeHead.lastCall.calledWithExactly(200,  {'Content-Type' : 'application/json'});
        res.write.lastCall.calledWithExactly('yay!');

        controller.match(req, res, function () {});
        res.writeHead.lastCall.calledWithExactly(200,  {'Content-Type' : 'application/json'});
        res.write.lastCall.calledWithExactly('OK');
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
                write: sinon.stub(),
                writeHead: sinon.stub(),
                setHeader: sinon.stub(),
                end: sinon.stub(),
                send: sinon.stub()
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


    it('Should respond with header application/json when response is of type JSON', function () {
        var next = sinon.stub(),

            obj = {
                route: '/abc',
                responseCode: 200,
                responseBody: {"foo": "bar"}
            },
            req = {
                params: {
                    route: '/abc',
                }
            },
            res = {
                send: sinon.stub(),
                write: sinon.stub(),
                writeHead: sinon.stub(),
                end: sinon.stub()
            };

        controller.fakeResponse.add(obj);

        controller.match({
            url: '/abc',
        }, res, next);

        assert.isTrue(res.writeHead.calledWithExactly(200, {'Content-Type': 'application/json', 'Content-Length': 13}));
        assert.isTrue(res.write.calledWithExactly('OK'));
        assert.isTrue(res.end.calledOnce);
    });

    it('Should respond with header text/plain when response is of type text', function () {
        var next = sinon.stub(),
            obj = {
                route: '/abc',
                responseCode: 200,
                responseBody: 'OK'
            },
            req = {
                params: {
                    route: '/abc',
                }
            },
            res = {
                send: sinon.stub(),
                write: sinon.stub(),
                writeHead: sinon.stub(),
                end: sinon.stub()
            };

        controller.fakeResponse.add(obj);

        controller.match({
            url: '/abc',
        }, res, next);


        assert.isTrue(res.writeHead.calledWithExactly(200, {"Content-Type": "'text/plain'", 'Content-Length': 2}));
        assert.isTrue(res.write.calledWithExactly('OK'));
        assert.isTrue(res.end.calledOnce);
    });

    it('should work with POST requests', function () {
        var next = sinon.stub(),
            obj = {
                route: '/abc',
                payload: {
                    'name': 'something',
                    'id': 1
                },
                responseCode: 200,
                responseBody: 'OK'
            },
            req = {
                url: '/abc',
                params: {
                    route: '/abc',
                },
                body: {
                    'id': 1,
                    'name': 'something'
                }
            },
            res = {
                send: sinon.stub(),
                write: sinon.stub(),
                writeHead: sinon.stub(),
                end: sinon.stub()
            };

        controller.fakeResponse.add(obj);

        controller.match(req, res, next);

        assert.isTrue(res.write.calledWithExactly('OK'));
        assert.isTrue(res.end.calledOnce);
    });

    it('should allow header matching (no-match)', function () {
        var config = {
            route: '/x',
            requiredHeaders: {
                'Cookie': 'A=.*'
            },
            responseCode: 123,
            responseBody: "BLAH"
        };

        var invalid_req = {
            url: '/x',
            params: {
                route: '/x'
            }
        };

        var res = {
            send: sinon.stub(),
            write: sinon.stub(),
            writeHead: sinon.stub(),
            end: sinon.stub()
        };

        controller.fakeResponse.add(config);
        controller.match(invalid_req, res, sinon.stub());

        assert.isTrue(res.send.calledWith(404, 'no match!'));
    });

    it('should allow header matching', function () {
        var config = {
            route: '/x',
            requiredHeaders: {
                'Cookie': 'A=.*'
            },
            responseCode: 123,
            responseBody: "BLAH"
        };

        var req = {
            url: '/x',
            headers: {
                'Some': 'thing',
                'Cookie': 'A=adsfadfadsf'
            },
            params: {
                route: '/x'
            }
        };

        var res = {
            send: sinon.stub(),
            write: sinon.stub(),
            writeHead: sinon.stub(),
            end: sinon.stub()
        };

        controller.fakeResponse.add(config);
        controller.match(req, res, sinon.stub());

        assert.isTrue(res.write.calledWith('BLAH'));
        assert.isTrue(res.writeHead.calledWith(123));

    });

    it('should provide a way to add new responses for a given endpoint with responseBody containing json object', function () {
        var req = {
            params: {
                route: '/foo/bar',
                responseCode: '404',
                responseBody: {"foo": "bar"}
            }
        };
        var res = {
            send: sinon.stub()
        };

        sinon.stub(controller.fakeResponse, 'add');

        controller.add(req, res, function () {
        });

        assert.isTrue(controller.fakeResponse.add.calledOnce);

        assert.isTrue(controller.fakeResponse.add.calledWith(sinon.match({
            route: '/foo/bar',
            responseCode: '404',
            responseBody: {"foo": "bar"}
        })));

        controller.fakeResponse.add.restore();
    });

    it('should provide a way to remove existing best matched endpoint', function () {
        var req = {
            params: {
                route: '/foo/bar',
                queryParams: {'id': 5, 'username': 'foo'},
                payload: {'this': 'that'},
                requiredHeaders: {'Content-Type': 'application/json'},
                responseCode: '404',
                responseBody: {"foo": "bar"}
            }
        };
        var res = {
            send: sinon.stub()
        };

        sinon.stub(controller.fakeResponse, 'remove');

        controller.remove(req, res, function () {
        });

        assert.isTrue(controller.fakeResponse.remove.calledOnce);

        assert.isTrue(controller.fakeResponse.remove.calledWith('/foo/bar?id=5&username=foo', {'this': 'that'}, {'Content-Type': 'application/json'}));

        controller.fakeResponse.remove.restore();
    });
});
