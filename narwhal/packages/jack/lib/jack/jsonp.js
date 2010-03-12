var Request = require("./request").Request,
    HashP = require("hashp").HashP;

// Wraps a response in a JavaScript callback if provided in the "callback" parameter,
// JSONP style, to enable cross-site fetching of data. Be careful where you use this.
// http://bob.pythonmac.org/archives/2005/12/05/remote-json-jsonp/
var JSONP = exports.JSONP = function(app, callbackParameter) {
    return function(env) {
        var response = app(env),
            request = new Request(env);
            
        var callback = request.params(callbackParameter || "callback");
        
        if (callback) {
            
            var header = (callback+"(").toByteString(),
                footer = (")").toByteString();

            HashP.set(response.headers, "Content-Type", "application/javascript");
            
            // Assume the Content-Length was correct before and simply add the length of the padding.
            if (HashP.includes(response.headers, "Content-Length")) {
                var contentLength = parseInt(HashP.get(response.headers, "Content-Length"), 10);
                contentLength += header.length + footer.length;
                HashP.set(response.headers, "Content-Length", String(contentLength));
            }
            
            var body = response.body;
            response.body = { forEach : function(block) {
                block(header);
                body.forEach(block);
                block(footer);
            }};
        }
        
        return response;
    }
}
