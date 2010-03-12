var file = require("file"),
    ByteIO = require("io").ByteIO;

// Every standard HTTP code mapped to the appropriate message.
// Stolen from Rack which stole from Mongrel
exports.HTTP_STATUS_CODES = {
    100 : 'Continue',
    101 : 'Switching Protocols',
    102 : 'Processing',
    200 : 'OK',
    201 : 'Created',
    202 : 'Accepted',
    203 : 'Non-Authoritative Information',
    204 : 'No Content',
    205 : 'Reset Content',
    206 : 'Partial Content',
    207 : 'Multi-Status',
    300 : 'Multiple Choices',
    301 : 'Moved Permanently',
    302 : 'Found',
    303 : 'See Other',
    304 : 'Not Modified',
    305 : 'Use Proxy',
    307 : 'Temporary Redirect',
    400 : 'Bad Request',
    401 : 'Unauthorized',
    402 : 'Payment Required',
    403 : 'Forbidden',
    404 : 'Not Found',
    405 : 'Method Not Allowed',
    406 : 'Not Acceptable',
    407 : 'Proxy Authentication Required',
    408 : 'Request Timeout',
    409 : 'Conflict',
    410 : 'Gone',
    411 : 'Length Required',
    412 : 'Precondition Failed',
    413 : 'Request Entity Too Large',
    414 : 'Request-URI Too Large',
    415 : 'Unsupported Media Type',
    416 : 'Request Range Not Satisfiable',
    417 : 'Expectation Failed',
    422 : 'Unprocessable Entity',
    423 : 'Locked',
    424 : 'Failed Dependency',
    500 : 'Internal Server Error',
    501 : 'Not Implemented',
    502 : 'Bad Gateway',
    503 : 'Service Unavailable',
    504 : 'Gateway Timeout',
    505 : 'HTTP Version Not Supported',
    507 : 'Insufficient Storage'
};

exports.HTTP_STATUS_MESSAGES = {};
for (var code in exports.HTTP_STATUS_CODES)
    exports.HTTP_STATUS_MESSAGES[exports.HTTP_STATUS_CODES[code]] = parseInt(code);

exports.STATUS_WITH_NO_ENTITY_BODY = function(status) { return (status >= 100 && status <= 199) || status == 204 || status == 304; };

exports.responseForStatus = function(status, optMessage) {
    if (exports.HTTP_STATUS_CODES[status] === undefined)
        throw "Unknown status code";
    
    var message = exports.HTTP_STATUS_CODES[status];
    
    if (optMessage)
        message += ": " + optMessage;
    
    var body = (message+"\n").toByteString("UTF-8");
    
    return {
        status : status,
        headers : { "Content-Type" : "text/plain", "Content-Length" : String(body.length) },
        body : [body]
    };
}

exports.parseQuery      = require("jack/querystring").parseQuery;
exports.toQueryString   = require("jack/querystring").toQueryString;
exports.unescape        = require("jack/querystring").unescape;
exports.escape          = require("jack/querystring").escape;


var EOL = "\r\n";

exports.parseMultipart = function(env, options) {
    options = options || {};
    
    var match, i, data;
    if (env['CONTENT_TYPE'] && (match = env['CONTENT_TYPE'].match(/^multipart\/form-data.*boundary=\"?([^\";,]+)\"?/m))) {
        var boundary = "--" + match[1],

            params = {},
            buf = "",
            contentLength = parseInt(env['CONTENT_LENGTH']),
            input = env['jsgi.input'],
            
            boundaryLength = boundary.length + EOL.length,
            bufsize = 16384;
            
        contentLength -= boundaryLength;
            
        var status = input.read(boundaryLength).decodeToString();
        if (status !== boundary + EOL)
            throw new Error("EOFError bad content body");

        var rx = new RegExp("(?:"+EOL+"+)?"+RegExp.escape(boundary)+"("+EOL+"|--)");

        while (true) {
            var head = null,
                body = new ByteIO(),
                filename = null,
                contentType = null,
                name = null,
                tempfile = null;

            while (!head || !rx.test(buf)) {
                if (!head && (i = buf.indexOf("\r\n\r\n")) > 0) {
                    head = buf.substring(0, i+2);
                    buf = buf.substring(i+4);
                    
                    match = head.match(/Content-Disposition:.* filename="?([^\";]*)"?/i);
                    filename = match && match[1];
                    match = head.match(/Content-Type: (.*)\r\n/i);
                    contentType = match && match[1];
                    match = head.match(/Content-Disposition:.* name="?([^\";]*)"?/i);
                    name = match && match[1];
                    
                    if (filename) {
                        // TODO: bypass String conversion for files, use Binary/ByteString directly
                        if (options.nodisk) {
                            tempfile = null;
                            body = new ByteIO();
                        } else {
                            tempfile = "/tmp/jackupload-"+Math.round(Math.random()*100000000000000000).toString(16);
                            body = file.open(tempfile, "wb");
                        }
                    }
                    
                    continue;
                }

                // Save the read body part.
                if (head && (boundaryLength + 4 < buf.length)) {
                    body.write(buf.slice(0, buf.length - (boundaryLength + 4)));
                    buf = buf.slice(buf.length - (boundaryLength + 4));
                }
                
                var bytes = input.read(bufsize < contentLength ? bufsize : contentLength);
                if (!bytes)
                    throw new Error("EOFError bad content body");
                
                var c = bytes.decodeToString();

                buf += c;
                contentLength -= bytes.length;
            }

            // Save the rest.
            if (match = buf.match(rx)) {
                body.write(buf.slice(0, match.index));
                buf = buf.slice(match.index + boundaryLength + 2);

                if (match[1] === "--")
                    contentLength = -1;
            }

            if (filename === "") {
                data = null;
            }
            else if (filename || (!filename && contentType)) {
                body.close();
                //body.rewind();
                data = {
                    "filename"  : filename,
                    "type"      : contentType,
                    "name"      : name,
                    "tempfile"  : tempfile || body.toByteString(), // body
                    "head"      : head
                };
                if (filename) {
                    // Take the basename of the upload's original filename.
                    // This handles the full Windows paths given by Internet Explorer
                    // (and perhaps other broken user agents) without affecting
                    // those which give the lone filename.
                    data.filename = filename.match(/^(?:.*[:\\\/])?(.*)/m)[1];
                }
            } else {
                data = body.decodeToString();
            }

            if (name) {
                if (/\[\]$/.test(name)) {
                    params[name] = params[name] || [];
                    params[name].push(data);
                } else {
                    params[name] = data;
                }
            }
            if (!buf || contentLength == -1)
                break;
        }
        
        return params;
    }
    
    return null;
}
