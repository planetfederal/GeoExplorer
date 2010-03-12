var utils = require("./utils"),
    HashP = require("hashp").HashP;

// Sets the Content-Length header on responses with fixed-length bodies.
var ContentLength = exports.ContentLength = function(app) {
    return function(env) {
        var response = app(env);
        if (!utils.STATUS_WITH_NO_ENTITY_BODY(response.status) &&
            !HashP.includes(response.headers, "Content-Length") &&
            !(HashP.includes(response.headers, "Transfer-Encoding") && HashP.get(response.headers, "Transfer-Encoding") !== "identity") && 
            typeof response.body.forEach === "function")
        {
            var newBody = [],
                length = 0;
                
            response.body.forEach(function(part) {
                var binary = part.toByteString();
                length += binary.length;
                newBody.push(binary);
            });
            
            response.body = newBody;

            HashP.set(response.headers, "Content-Length", String(length));
        }

        return response;
    }
}
