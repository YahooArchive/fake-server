var ResponseDesc = function (route) {
    this.route = route;
};

var setValueIfDefined = function (obj, key, value) {
    if (value != undefined)
        obj[key] = value;
    return obj;
};

ResponseDesc.prototype = {
    withQueryParams: function (parameters) {
        setValueIfDefined(this, 'queryParams', parameters);
        return this;
    },

    withHeaders: function (headers) {
        setValueIfDefined(this, 'requiredHeaders', headers);
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
        else if(typeof data == 'string')
            this.responseBody = decodeURIComponent(data.replace(/&quot;/g, '"'));
        else
            this.responseBody = 'Corrupted Data.';
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