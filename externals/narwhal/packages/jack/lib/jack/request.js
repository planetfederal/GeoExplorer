var utils = require("./utils"),
    Hash = require("hash").Hash;

var Request = exports.Request = function(env) {
    if (env["jack.request"])
        return env["jack.request"];
        
    this.env = env;
    this.env["jack.request"] = this;
}

Request.prototype.body = function() {
    if (!this.env["jack.request.body"])
        this.env["jack.request.body"] = this.env["jsgi.input"].read();
    
    return this.env["jack.request.body"];
};

Request.prototype.scheme          = function() { return this.env["jsgi.url_scheme"];           };
Request.prototype.scriptName      = function() { return this.env["SCRIPT_NAME"];               };
Request.prototype.pathInfo        = function() { return this.env["PATH_INFO"];                 };
Request.prototype.port            = function() { return parseInt(this.env["SERVER_PORT"], 10); };
Request.prototype.requestMethod   = function() { return this.env["REQUEST_METHOD"];            };
Request.prototype.queryString     = function() { return this.env["QUERY_STRING"];              };
Request.prototype.referer         = function() { return this.env["HTTP_REFERER"];              };
Request.prototype.referrer        = Request.prototype.referer;
Request.prototype.contentLength   = function() { return parseInt(this.env["CONTENT_LENGTH"], 10); };
Request.prototype.contentType     = function() { return this.env["CONTENT_TYPE"] || null; };

Request.prototype.host = function() {
    // Remove port number.
    return (this.env["HTTP_HOST"] || this.env["SERVER_NAME"]).replace(/:\d+\z/g, "");
}
    
Request.prototype.isGet           = function() { return this.requestMethod() === "GET";        };
Request.prototype.isPost          = function() { return this.requestMethod() === "POST";       };
Request.prototype.isPut           = function() { return this.requestMethod() === "PUT";        };
Request.prototype.isDelete        = function() { return this.requestMethod() === "DELETE";     };
Request.prototype.isHead          = function() { return this.requestMethod() === "HEAD";       };

// The set of form-data media-types. Requests that do not indicate
// one of the media types presents in this list will not be eligible
// for form-data / param parsing.
var FORM_DATA_MEDIA_TYPES = [
    null,
    'application/x-www-form-urlencoded',
    'multipart/form-data'
]

// Determine whether the request body contains form-data by checking
// the request media_type against registered form-data media-types:
// "application/x-www-form-urlencoded" and "multipart/form-data". The
// list of form-data media types can be modified through the
// +FORM_DATA_MEDIA_TYPES+ array.
Request.prototype.hasFormData = function() {
    var mediaType = this.mediaType();
    return FORM_DATA_MEDIA_TYPES.reduce(function(x, type) { return x || type == mediaType; }, false);
}

// The media type (type/subtype) portion of the CONTENT_TYPE header
// without any media type parameters. e.g., when CONTENT_TYPE is
// "text/plain;charset=utf-8", the media-type is "text/plain".
//
// For more information on the use of media types in HTTP, see:
// http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.7
Request.prototype.mediaType = function() {
    var contentType = this.contentType();
    return (contentType && contentType.split(/\s*[;,]\s*/, 2)[0].toLowerCase()) || null;
}

// The media type parameters provided in CONTENT_TYPE as a Hash, or
// an empty Hash if no CONTENT_TYPE or media-type parameters were
// provided.  e.g., when the CONTENT_TYPE is "text/plain;charset=utf-8",
// this method responds with the following Hash:
//   { 'charset' => 'utf-8' }
Request.prototype.mediaTypeParams = function() {
    var contentType = this.contentType();
    if (!contentType) return {};
    
    return contentType.split(/\s*[;,]\s*/).slice(1).map(
        function (s) { return s.split('=', 2); }).reduce(
        function (hash, pair) {
            hash[pair[0].toLowerCase()] = pair[1];
            return hash;
        }, {});
}

// The character set of the request body if a "charset" media type
// parameter was given, or nil if no "charset" was specified. Note
// that, per RFC2616, text/* media types that specify no explicit
// charset are to be considered ISO-8859-1.
Request.prototype.contentCharset = function() {
    return this.mediaTypeParams()['charset'] || null;
}

// Returns the data recieved in the query string.
Request.prototype.GET = function() {
    // cache the parsed query:
    if (this.env["jack.request.query_string"] !== this.queryString()) {
        this.env["jack.request.query_string"] = this.queryString();
        this.env["jack.request.query_hash"] = utils.parseQuery(this.queryString());
    }
    
    if (arguments.length > 0)
        return this.env["jack.request.query_hash"][arguments[0]];
        
    return this.env["jack.request.query_hash"];
}

// Returns the data recieved in the request body.
//
// This method support both application/x-www-form-urlencoded and
// multipart/form-data.
Request.prototype.POST = function() {
    var hash = {};
    if (this.env["jack.request.form_input"] === this.env["jsgi.input"])
        hash = this.env["jack.request.form_hash"];
    else if (this.hasFormData()) {
        this.env["jack.request.form_input"] = this.env["jsgi.input"];
        this.env["jack.request.form_hash"] = utils.parseMultipart(this.env);
        if (!this.env["jack.request.form_hash"]) {
            this.env["jack.request.form_vars"] = this.body().decodeToString(this.contentCharset() || "utf-8");
            this.env["jack.request.form_hash"] = utils.parseQuery(this.env["jack.request.form_vars"]);
            //this.env["jsgi.input"].rewind();
        }
        hash = this.env["jack.request.form_hash"];
    }
    
    if (arguments.length > 0)
        return hash[arguments[0]];
    
    return hash;
}

Request.prototype.params = function() {
    if (!this.env["jack.request.params_hash"])
        this.env["jack.request.params_hash"] = Hash.merge(this.GET(), this.POST());

    if (arguments.length > 0)
        return this.env["jack.request.params_hash"][arguments[0]];
            
    return this.env["jack.request.params_hash"];
}

Request.prototype.cookies = function() {
    if (!this.env["HTTP_COOKIE"]) return {};

    if (this.env["jack.request.cookie_string"] != this.env["HTTP_COOKIE"])  {
        this.env["jack.request.cookie_string"] = this.env["HTTP_COOKIE"]
        // According to RFC 2109:
        // If multiple cookies satisfy the criteria above, they are ordered in
        // the Cookie header such that those with more specific Path attributes
        // precede those with less specific. Ordering with respect to other
        // attributes (e.g., Domain) is unspecified.
        var hash = this.env["jack.request.cookie_hash"] = utils.parseQuery(this.env["HTTP_COOKIE"], /[;,]/g);
        for (var k in hash)
            if (Array.isArray(hash[k]))
                hash[k] = hash[k][0];
    }

    return this.env["jack.request.cookie_hash"];
}

Request.prototype.relativeURI = function() {
    var qs = this.queryString();
    
    if (qs) {
        return this.pathInfo() + "?" + qs;
    } else {
        return this.pathInfo();
    }
}

Request.prototype.uri = function() {
    var scheme = this.scheme(),
        port = this.port(),
        uri = scheme + "://" + this.host();

    if ((scheme == "https" && port != 443) || (scheme == "http" && port != 80)) {
        url = uri + port;
    }

    return uri + this.relativeURI();
}

var XHR_RE = new RegExp("XMLHttpRequest", "i");

// http://www.dev411.com/blog/2006/06/30/should-there-be-a-xmlhttprequest-user-agent
Request.prototype.isXHR = Request.prototype.isXMLHTTPRequest = function() {
    return XHR_RE.test(this.env["HTTP_X_REQUESTED_WITH"]);
}


/**
 * Returns an array of [encoding, quality] pairs.
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
 */
Request.prototype.acceptEncoding = function() {
    return this.env["HTTP_ACCEPT_ENCODING"].toString().split(/,\s*/).map(function(part) {
        var m = part.match(/^([^\s,]+?)(?:;\s*q=(\d+(?:\.\d+)?))?$/)     
        if (!m) throw("Invalid value for Accept-Encoding: " + part);
        return [m[1], Number(m[2] || 1.0)];
    });
}

/**
 * The remore ip address.
 */
Request.prototype.ip = Request.prototype.remoteAddr = function() {
    var addr = this.env["HTTP_X_FORWARDED_FOR"];
    if (addr) {
        var parts = addr.split(",");
        return parts[parts.length-1].trim();
    } else {
        return this.env["REMOTE_ADDR"];    
    }
}

