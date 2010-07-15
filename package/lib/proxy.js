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
        }
        // TODO: remaining headers
        var body;
        var input = env["jsgi.input"];
        if (input) {
            var charSet = request.contentCharset();
            body = {
                forEach: function(callback) {
                    callback(input.readChunk().toString(charSet));
                }
            };
        }
        if (body) {
            if (!contentLength) {
                throw new Error("Can't proxy body without Content-Length header");
            }
            client.setOption("body", body);
        }
        resp = HttpClient.decode(client.connect());
    } else {
        resp = responseForStatus(400);
    }
        
    return resp;

};

exports.app = app;