'use strict';

var ResponseDescBuilder = require('../libs/responseDescBuilder.js');
var assert = require('chai').assert;

describe('ResponseDescBuilder Test', function () {
    describe('new ResponseDescBuilder(route)', function () {
        it('should set "route" key with the given route', function () {
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar');

            assert.equal(fakeResponseDesc.route, '/foo/bar')
        });
    });

    describe('withQueryParams(params)', function () {
        it('should set "queryParams" key with the given query parameters', function () {
            var queryParams = {'id': '10'};
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .withQueryParams(queryParams);

            assert.equal(fakeResponseDesc.queryParams, queryParams)
        });

        it('should not add "queryParams" key when query parameters are not passed', function () {
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .withQueryParams();

            assert.doesNotHaveAnyKeys(fakeResponseDesc, ['queryParams']);
        });
    });

    describe('withHeaders(headers)', function () {
        it('should set "requiredHeaders" key with given header making key\'s of header to lower case', function () {
            var requiredHeaders = {'Cookie': 'username=.*'};
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .withHeaders(requiredHeaders);

            assert.deepEqual(fakeResponseDesc.requiredHeaders, {'cookie': 'username=.*'})
        });

        it('should not add "requiredHeaders" key when no headers is passed', function () {
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .withHeaders();

            assert.doesNotHaveAnyKeys(fakeResponseDesc, ['requiredHeaders']);
        });
    });

    describe('withPayload(data)', function () {
        it('should set "payload" key with given data', function () {
            var payload = {'foo': 'bar'};
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .withPayload(payload);

            assert.deepEqual(fakeResponseDesc.payload, payload)
        });

        it('should not add "payload" key when no payload data is given', function () {
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .withPayload();

            assert.doesNotHaveAnyKeys(fakeResponseDesc, ['payload']);
        });

    });

    describe('sendResponseCode(code)', function () {
        it('should set "responseCode" key with given code', function () {
            var responseCode = 200;
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .sendResponseCode(responseCode);

            assert.equal(fakeResponseDesc.responseCode, responseCode)
        });

        it('should set "responseCode" key with 404 when no response code given', function () {
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .sendResponseCode();

            assert.equal(fakeResponseDesc.responseCode, 404)
        });
    });

    describe('sendResponseBody(data)', function () {
        it('should set "responseBody" key after decoded given string data', function () {
            var encodedResponseBody = 'I%20am%20the%20a%20kind%20of%20response%20body';
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .sendResponseBody(encodedResponseBody);

            var decodedResponseBody = 'I am the a kind of response body';
            assert.equal(fakeResponseDesc.responseBody, decodedResponseBody)
        });

        it('should set "responseBody" key with given object data', function () {
            var responseBody = {'foo': 'bar'};
            var fakeResponse = new ResponseDescBuilder('/foo/bar')
                .sendResponseBody(responseBody);

            assert.equal(fakeResponse.responseBody, responseBody)
        });

        it('should set "responseBody" key with "Corrupted Data." when bad data is given', function () {
            var responseBody = 434432;
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .sendResponseBody(responseBody);

            assert.equal(fakeResponseDesc.responseBody, 'Corrupted Data.')
        });
    });

    describe('sendResponseData(relativeFilePath)', function () {
        it('should set "responseData" key with given relative file path from server', function () {
            var responseData = './foo/bar.json';
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .sendResponseData(responseData);

            assert.equal(fakeResponseDesc.responseData, responseData)
        });

        it('should not set "responseData" key when file path is not provided', function () {
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .sendResponseData();

            assert.equal(fakeResponseDesc.responseData, undefined)
        });
    });

    describe('sendResponseHeaders(headers)', function () {
        it('should set "responseHeaders" key with the given headers', function () {
            var responseHeaders = {'Access-Control-Allow-Origin': 'http://localhost:3012'};
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .sendResponseHeaders(responseHeaders);

            assert.deepEqual(fakeResponseDesc.responseHeaders, responseHeaders)
        });

        it('should not set "responseHeaders" key when no header is given', function () {
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .sendResponseHeaders();

            assert.doesNotHaveAnyKeys(fakeResponseDesc, ['responseHeaders']);
        });
    });

    describe('delayResponseBody(ms)', function () {
        it('should set "delay" key with given response delay in ms', function () {
            var responseDelay = 10;
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .delayResponseBy(responseDelay);

            assert.equal(fakeResponseDesc.delay, responseDelay)
        });

        it('should not add "delay" key when no delay is given', function () {
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .delayResponseBy();

            assert.doesNotHaveAnyKeys(fakeResponseDesc, ['delay']);
        });
    });

    describe('respondAtCall(callNumber)', function () {
        it('should set "at" key with given call number', function () {
            var callNumber = 10;
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .respondAtCall(callNumber);

            assert.equal(fakeResponseDesc.at, callNumber)
        });

        it('should not set "at" key when no call number is provided', function () {
            var fakeResponseDesc = new ResponseDescBuilder('/foo/bar')
                .respondAtCall();

            assert.doesNotHaveAnyKeys(fakeResponseDesc, ['at']);
        });
    });
});