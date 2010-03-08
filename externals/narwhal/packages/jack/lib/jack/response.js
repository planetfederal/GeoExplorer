var HashP = require("hashp").HashP;

var Response = exports.Response = function(status, headers, body) {
    var that = this;
    
    if (typeof arguments[0] === "object") {
        headers = arguments[0].headers;
        body = arguments[0].body;
        status = arguments[0].status;
    }
    
    this.status = status || 200;
    if (this.status !== 304) {
        this.headers = HashP.merge({"Content-Type" : "text/html"}, headers);
    } else {
        this.headers = headers || {};
    }
    
    this.body = [];
    this.length = 0;
    this.writer = function(bytes) { that.body.push(bytes); };
    
    this.block = null;
    
    if (body)
    {
        if (typeof body.forEach === "function")
        {
            body.forEach(function(part) {
                that.write(part);
            });
        }
        else
            throw new Error("iterable required");
    }
}

Response.prototype.setHeader = function(key, value) {
    HashP.set(this.headers, key, value);
}

Response.prototype.addHeader = function(key, value) {
    var header = HashP.get(this.headers, key);
    
    if (!header)
        HashP.set(this.headers, key, value);
    else if (typeof header === "string")
        HashP.set(this.headers, key, [header, value]);
    else // Array
        header.push(value);
}

Response.prototype.getHeader = function(key) {
    return HashP.get(this.headers, key);
}

Response.prototype.unsetHeader = function(key) {
    return HashP.unset(this.headers, key);
}

Response.prototype.setCookie = function(key, value) {
    var domain, path, expires, secure, httponly;
    
    var cookie = encodeURIComponent(key) + "=", 
        meta = "";
    
    if (typeof value === "object") {
        if (value.domain) meta += "; domain=" + value.domain ;
        if (value.path) meta += "; path=" + value.path;
        if (value.expires) meta += "; expires=" + value.expires.toGMTString();
        if (value.secure) meta += "; secure";
        if (value.httpOnly) meta += "; HttpOnly";
        value = value.value;
    }

    if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++)
            cookie += encodeURIComponent(value[i]);
    } else {
        cookie += encodeURIComponent(value);
    }
    
    cookie = cookie + meta;
    
    this.addHeader("Set-Cookie", cookie);
}

Response.prototype.deleteCookie = function() {
    // FIXME: implement me!
    throw new Error("Unimplemented method: Response.prototype.deleteCookie");
}

Response.prototype.redirect = function(location, status) {
    this.status = status || 302;
    this.addHeader("Location", location);
    this.write('Go to <a href="' + location + '">' + location + "</a>");
}
    
Response.prototype.write = function(object) {
    var binary = object.toByteString('utf-8');
    this.writer(binary);
    this.length += binary.length;
    
    // TODO: or
    // this.writer(binary);
    // this.length += binary.byteLength();
    
    HashP.set(this.headers, "Content-Length", this.length.toString(10));
}

Response.prototype.finish = function(block) {
    this.block = block;
    
    if (this.status == 204 || this.status == 304)
    {
        HashP.unset(this.headers, "Content-Type");
        return {
            status : this.status,
            headers : this.headers,
            body : []
        };
    }
    else
    {
        return {
            status : this.status,
            headers : this.headers,
            body : this
        };
    }
}

Response.prototype.forEach = function(callback) {
    this.body.forEach(callback);

    this.writer = callback;
    if (this.block)
        this.block(this);
}

Response.prototype.close = function() {
    if (this.body.close)
        this.body.close();
}

Response.prototype.isEmpty = function() {
    return !this.block && this.body.length === 0;
}

Response.redirect = function(location, status) {
    status = status || 303;
    var body = 'Go to <a href="' + location + '">' + location + '</a>';
    return {
        status : status,
        headers : {
            "Location": location,
            "Content-Type": "text/plain",
            "Content-Length": String(body.length)
        },
        body : [body]
    };
}

var AsyncResponse = exports.AsyncResponse = function(status, headers, body) {
    // set the buffer up first, since Response's constructor calls .write()
    this._buffer = [];
    
    this._callback  = null;
    this._errback   = null;
    
    Response.apply(this, arguments);
    
    this.body = { forEach : this.forEach.bind(this) };
}

AsyncResponse.prototype = Object.create(Response.prototype);

// this "write" gets overriden later by the callback provided to forEach
AsyncResponse.prototype.write = function(chunk) {
    this._buffer.push(chunk);
}

AsyncResponse.prototype.forEach = function(callback) {
    this._buffer.forEach(callback);
    this._buffer = null;
    
    this.write = callback;

    return { then : this.then.bind(this) };
}

AsyncResponse.prototype.then = function(callback, errback) {
    this._callback = callback;
    this._errback = errback;
}

AsyncResponse.prototype.close = function() {
    this._callback();
}
