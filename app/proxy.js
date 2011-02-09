var Client = require("ringo/httpclient").Client;
var Request = require("ringo/webapp/request").Request;
var MemoryStream = require("io").MemoryStream;
var merge = require("ringo/utils/objects").merge;
var responseForStatus = require("./util").responseForStatus;
var defer = require("ringo/promise").defer;

var app = exports.app = function(env) {
    var response;
    var request = new Request(env);
    var url = request.queryParams.url;
    if (url) {
        response = proxyPass(request, url, true);
    } else {
        response = responseForStatus(400, "Request must contain url parameter.");
    }
    return response;
};

var pass = exports.pass = function(config) {
    if (typeof config == "string") {
        config = {url: config};
    }
    return function(env, match) {
        var request = new Request(env);
        var newUrl = config.url + match + (request.queryString ? "?" + request.queryString : "");
        return proxyPass(request, newUrl, config.preserveHost, config.allowAuth);
    };
};

function proxyPass(request, url, preserveHost, allowAuth) {
    var parts = url.split("/");
    var response;
    if (parts[0] !== (request.scheme + ":") || parts[1] !== "") {
        print(parts);
        response = responseForStatus(400, "The url parameter value must be absolute url with same scheme as request.");
    } else {
        // re-issue request
        var host = parts[2];
        var client = new Client();
        response = defer();
        // deal with headers
        var headers = preserveHost ? merge({host: host}, request.headers) : request.headers;
        if (!allowAuth) {
            // strip authorization and cookie headers
            delete headers["Authorization"];
            delete headers["Cookie"];
        }

        var exchange = client.request({
            url: url,
            method: request.method,
            headers: headers,
            data: request.contentLength && request.input,
            async: true,
            complete: function() {
                if (exchange) {
                    var headers = merge({}, exchange.headers);
                    if (!allowAuth) {
                        // strip out authorization and cookie headers
                        delete headers["WWW-Authenticate"];
                        delete headers["Set-Cookie"];
                    }
                    response.resolve({
                        status: exchange.status,
                        headers: headers,
                        body: new MemoryStream(exchange.contentBytes)
                    });
                } else {
                    response.resolve({
                        status: 408,
                        headers: {"Content-Type": "text/plain"},
                        body: ["Request Timeout"]
                    });
                }
            }
        });
    }
    return response;
}
