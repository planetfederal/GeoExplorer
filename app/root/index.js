var Request = require("ringo/webapp/request").Request;
var Response = require("ringo/webapp/response").Response;

exports.app = function(env) {
    var request = new Request(env);
    var parts = request.path.split("/");
    parts.pop();
    parts.push("composer");
    return {
        status: 302,
        headers: {"Location": request.scheme + "://" + request.host + ":" + request.port + parts.join("/")},
        body: []
    };
}
