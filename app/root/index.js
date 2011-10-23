
exports.app = function(request) {
    var parts = request.pathInfo.split("/");
    parts.pop();
    parts.push("composer");
    return {
        status: 302,
        headers: {"Location": request.scheme + "://" + request.host + ":" + request.port + parts.join("/")},
        body: []
    };
}
