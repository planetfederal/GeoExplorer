var Request = require("ringo/webapp/request").Request;
var auth = require("../auth");

exports.app = function(req) {
    var request = new Request(req);
    var exchange = auth.requestAuthorization(request);
    var headers = exchange.headers;
    var status = exchange.status;
    if (status === 401) {
        headers.unset("WWW-Authenticate");
    }
    return {
        status: status,
        headers: headers,
        body: []
    };
};
