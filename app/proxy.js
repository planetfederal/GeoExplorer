var Client = require("ringo/httpclient").Client;
var {Request} = require("ringo/webapp/request");
var {MemoryStream} = require("io");
var {merge} = require("ringo/utils/objects");
var responseForStatus = require("./util").responseForStatus;

var app = function(env) {
    var resp;
    var request = new Request(env);
    var url = request.queryParams.url;
    if (url) {
        var parts = url.split("/");
        if (parts[0] !== (request.scheme + ":") || parts[1] !== "") {
            resp = responseForStatus(400, "The url parameter value must be absolute url with same scheme as request.");
        } else {
            // re-issue request
            var host = parts[2];
            var client = new Client();
            var exchange = client.request({
                url: url,
                method: request.method,
                headers: merge({host: host}, request.headers),
                data: request.contentLength && request.input
            });
            exchange.wait();

            resp = {
                status: exchange.status,
                headers: exchange.headers,
                body: new MemoryStream(exchange.contentBytes)
            };
        }
    } else {
        resp = responseForStatus(400, "Request must contain url parameter.");
    }
    return resp;
};

exports.app = app;