/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack::Auth
 * http://github.com/rack/rack
 */

var Hash = require("hash").Hash,
    Util = require("util");

var UNQUOTED = ['qop', 'nc', 'stale'];

var dequote = function(str) {
    var m = str.match(/^["'](.*)['"]$/);
    return  m ? m.pop() : str;
}

var extractPairs = function(str) {
    return str.match(/(\w+\=(?:"[^\"]+"|[^,]+))/g) || [];
}

var parse = exports.parse = function(h, str) {
    extractPairs(str).forEach(function(pair) {
        var kv = pair.match(/(\w+)=(.*)/);
        h[kv[1]] = dequote(kv[2]);
    });

    return h;
};

var toString = exports.toString = function(h) {
    return Hash.map(h, function(k, v) {
        return String.concat(k, "=", UNQUOTED.indexOf(k) != -1 ? v.toString() : Util.enquote(v.toString()));
    }).join(', ');
};