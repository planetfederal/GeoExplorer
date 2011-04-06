var clientRequest = require("ringo/httpclient").request;
var Request = require("ringo/webapp/request").Request;
var MemoryStream = require("io").MemoryStream;

var app = exports.app = function(env) {
    var response;
    var request = new Request(env);
    var exchange = clientRequest({
        url: "http://localhost:8080/geoserver/wms?" + request.queryString,
        method: "GET",
        async: false
    });
    exchange.wait();
    return {
        status: exchange.status,
        headers: exchange.headers,
        body: new MemoryStream(exchange.contentBytes)
    };
};

