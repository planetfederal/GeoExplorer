var util = require("util"),
    Request = require("jack/request").Request,
    Response = require("jack/response").Response,
    sha = require("sha"),
    HashP = require("hashp").HashP;

var loadSession = function(env){
    var options = env["jsgi.session.options"],
        key = options.key,
        secret = options.secret;

    var req = new Request(env);
    var cookie = req.cookies()[key];

    if (cookie){
        var parts = decodeURIComponent(cookie).split("--"),
            digest = env["jsgi.session.digest"] = parts[1];
            sessionData = parts[0];

        if (digest == sha.hash(sessionData + secret).decodeToString(64))  {
            return JSON.parse(sessionData);
        }
    }

    return {};
}

var commitSession = function(env, jsgiResponse, key, secret){
    var session = env["jsgi.session"];

    if (!session) return jsgiResponse;

    var sessionData = JSON.stringify(session);

    var digest = sha.hash(sessionData + secret).decodeToString(64);

    // do not serialize if the session is not dirty.
    if (digest == env["jsgi.session.digest"]) return jsgiResponse;

    sessionData = sessionData + "--" + digest;

    if (sessionData.length > 4096) {
        env["jsgi.errors"] += "Session Cookie data size exceeds 4k!  Content dropped";
        return jsgiResponse;
    }
    
    var options = env["jsgi.session.options"];

    var cookie = { value: sessionData };
    if (options["expires_after"])
        cookie.expires = new Date() + options["expires_after"];

    var response = new Response(jsgiResponse.status, jsgiResponse.headers, jsgiResponse.body);
    response.setCookie(key, cookie);

    return response;
}

/**
 * Cookie Session Store middleware.
 * Does not implicitly deserialize the session, only serializes the session if
 * dirty.
 */
var Cookie = exports.Cookie = function(app, options) {
    options = options || {};
    util.update(options, /* default options */ {
        key: "jsgi.session",
        domain: null,
        path: "/",
        expire_after: null
    });

    if (!options.secret) throw new Error("Session secret not defined");

    var key = options.key,
        secret = options.secret;

    return function(env) {
        env["jsgi.session.loadSession"] = loadSession;
        env["jsgi.session.options"] = options;

        var jsgiResponse = app(env);

        return commitSession(env, jsgiResponse, key, secret);
    }
}
