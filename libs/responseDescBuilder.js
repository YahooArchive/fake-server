var ResponseDesc = function (route) {
    this.route = route;
};

var setValueIfDefined = function (obj, key, value) {
    if (value != undefined)
        obj[key] = value;
    return obj;
};

var withLoweredKeys = function (obj) {
    if (obj == undefined) return undefined;
    return Object.keys(obj).reduce(function (withLoweredKey, key) {
        withLoweredKey[key.toLowerCase()] = obj[key];
        return withLoweredKey;
    }, {});
};

ResponseDesc.prototype = {
    withQueryParams: function (parameters) {
        setValueIfDefined(this, 'queryParams', parameters);
        return this;
    },

    withHeaders: function (headers) {
        setValueIfDefined(this, 'requiredHeaders', withLoweredKeys(headers));
        return this;
    },

    withPayload: function (data) {
        setValueIfDefined(this, 'payload', data);
        return this;
    },

    sendResponseCode: function (code) {
        this.responseCode = code || 404;
        return this;
    },

    sendResponseBody: function (data) {
        if (typeof data == 'object')
            this.responseBody = data;
        else if (typeof data == 'string')
            this.responseBody = decodeURIComponent(data.replace(/&quot;/g, '"'));
        else
            this.responseBody = 'Corrupted Data.';
        return this;
    },

    sendResponseHeaders: function (headers) {
        setValueIfDefined(this, 'responseHeaders', headers);
        return this;
    },

    delayResponseBy: function (ms) {
        setValueIfDefined(this, 'delay', ms);
        return this;
    },

    respondAtCall: function (callNumber) {
        setValueIfDefined(this, 'at', callNumber);
        return this;
    }
};

module.exports = ResponseDesc;