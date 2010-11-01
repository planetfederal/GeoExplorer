var {Response} = require("ringo/webapp/response");

var responseForStatus = function(status, msg) {
    var response = new Response(msg || codes[status]);
    response.status = status;
    return response;
};

var codes = {
    100: "Continue",
    101: "Switching Protocols",
    102: "Processing",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Request Entity Too Large",
    414: "Request-URI Too Large",
    415: "Unsupported Media Type",
    416: "Request Range Not Satisfiable",
    417: "Expectation Failed",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    507: "Insufficient Storage"
};

exports.responseForStatus = responseForStatus;

var URLMap = exports.URLMap = function(map, options) {
    var options = options || { longestMatchFirst : true },
        mapping = [];
        
    for (var location in map) {
        var app = map[location],
            host = null,
            match;
        
        if (match = location.match(/^https?:\/\/(.*?)(\/.*)/)) {
            host = match[1];
            location = match[2];
        }
            
        if (location.charAt(0) != "/") {
            throw new Error("paths need to start with / (was: " + location + ")");
        }
        
        mapping.push([host, location.replace(/\/+$/,""), app]);
    }
    // if we want to match longest matches first, then sort
    if (options.longestMatchFirst) {
        mapping = mapping.sort(function(a, b) {
            return (b[1].length - a[1].length) || ((b[0]||"").length - (a[0]||"").length);
        });
    }
    
    return function(env, path) {
        path = (path || env.pathInfo).replace(/\/+$/,"");
        var hHost = env.host, sPort = env.port;

        for (var i = 0; i < mapping.length; i++) {
            var host = mapping[i][0], location = mapping[i][1], app = mapping[i][2];

            if ((host === hHost || (host === null)) &&
                (location === path.substring(0, location.length)) &&
                (path.charAt(location.length) === "" || path.charAt(location.length) === "/"))
            {
                env = Object.create(env); // make a shallow "copy", since we're modifying SCRIPT_NAME / PATH_INFO

                env.scriptName += location;
                env.pathInfo = path.substring(location.length);

                return app(env);
            }
        }

        throw {notfound: true};
    }
}