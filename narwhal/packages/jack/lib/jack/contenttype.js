var HashP = require("hashp").HashP,
    STATUS_WITH_NO_ENTITY_BODY = require("jack/utils").STATUS_WITH_NO_ENTITY_BODY,
    MIME_TYPES = require("jack/mime").MIME_TYPES,
    DEFAULT_TYPE = "text/plain";

/**
 * This middleware makes sure that the Content-Type header is set for responses
 * that require it.
 */
exports.ContentType = function(app, options) {
    options = options || {};
    options.MIME_TYPES = options.MIME_TYPES || {};
    
    return function(env) {
        var response = app(env);

        if (!STATUS_WITH_NO_ENTITY_BODY(response.status) && !HashP.get(response.headers, "Content-Type")) {
            var contentType = options.contentType;
            if (!contentType) {
                var extension = env["PATH_INFO"].match(/(\.[^.]+|)$/)[0];
                contentType = options.MIME_TYPES[extension] || MIME_TYPES[extension] || DEFAULT_TYPE;
            }
            HashP.set(response.headers, "Content-Type", contentType);
        }
        
        return response;
    }
}
