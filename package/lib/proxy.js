var HttpClient = require("http-client").HttpClient;
var Request = require("jack").Request;
var responseForStatus = require("jack/utils").responseForStatus;

var app = function(env) {

    var request = new Request(env);
    
    var resp;
    var url = request.GET("url");
    if (url) {
        var client = new HttpClient({
            url: url,
            method: env["REQUEST_METHOD"]
        });
        var contentType = request.contentType();
        if (contentType) {
            client.setHeader("Content-Type", contentType);
        }
        var contentLength = request.contentLength();
        if (contentLength) {
            client.setHeader("Content-Length", contentLength);
            var input = env["jsgi.input"];
            if (input) {
                var charSet = request.contentCharset();
                client.setOption("body", {
                    forEach: function(callback) {
                        // TODO: fix this in narwhal (stream with forEach)
                        var chunk = input.read(contentLength).toString(charSet);
                        callback(chunk);
                    }                    
                });
            }
        }
        // TODO: remaining headers
        resp = HttpClient.decode(client.connect());
    } else {
        resp = responseForStatus(400);
    }
        
    return resp;

};

exports.app = app;