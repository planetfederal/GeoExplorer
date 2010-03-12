/*
 * Copyright Neville Burnell
 * See http://github.com/cloudwork/jack/lib/jack/auth/README.md for license
 *
 * Acknowledgements:
 * Inspired by Rack showstatus.rb
 * http://github.com/rack/rack
 *
 * escapeHTML() adapted from the nitro framework
 * http://github.com/gmosx/nitro
 */

var HashP = require("hashp").HashP,
    Request = require("./request").Request,
    HTTP_STATUS_CODES = require("./utils").HTTP_STATUS_CODES,
    sprintf = require("printf").sprintf;

var escapeHTML = function(str) {
    return str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
};

var ShowStatus = function(app) {
    return function(env) {
        var response = app(env);

        // client or server error, or explicit message
        if ((response.status >= 400 && response.body.length == 0) || env['jack.showstatus.detail']) {
            var req = new Request(env);
            var status = HTTP_STATUS_CODES[response.status] || String(response.status);

            response.body = [
                sprintf(template,
                    escapeHTML(status),
                    escapeHTML(req.scriptName() + req.pathInfo()),
                    escapeHTML(status),
                    response.status,
                    escapeHTML(req.requestMethod()),
                    escapeHTML(req.uri()),
                    escapeHTML(env["rack.showstatus.detail"] || status)
                )
            ];

            HashP.set(response.headers, "Content-Type", "text/html");
        }

        return response;
    }
};

exports.ShowStatus = function(app) {
    return require("jack").ContentLength(ShowStatus(app));
}

/*
  template adapted from Django <djangoproject.com>
  Copyright (c) 2005, the Lawrence Journal-World
  Used under the modified BSD license:
  http://www.xfree86.org/3.3.6/COPYRIGHT2.html#5
 */

var template ='\
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">\
<html lang="en">\
<head>\
  <meta http-equiv="content-type" content="text/html; charset=utf-8" />\
  <title>%s at %s</title>\
  <meta name="robots" content="NONE,NOARCHIVE" />\
  <style type="text/css">\
    html * { padding:0; margin:0; }\
    body * { padding:10px 20px; }\
    body * * { padding:0; }\
    body { font:small sans-serif; background:#eee; }\
    body>div { border-bottom:1px solid #ddd; }\
    h1 { font-weight:normal; margin-bottom:.4em; }\
    h1 span { font-size:60%; color:#666; font-weight:normal; }\
    table { border:none; border-collapse: collapse; width:100%; }\
    td, th { vertical-align:top; padding:2px 3px; }\
    th { width:12em; text-align:right; color:#666; padding-right:.5em; }\
    #info { background:#f6f6f6; }\
    #info ol { margin: 0.5em 4em; }\
    #info ol li { font-family: monospace; }\
    #summary { background: #ffc; }\
    #explanation { background:#eee; border-bottom: 0px none; }\
  </style>\
</head>\
<body>\
  <div id="summary">\
    <h1>%s <span>(%d)</span></h1>\
    <table class="meta">\
      <tr>\
        <th>Request Method:</th>\
        <td>%s</td>\
      </tr>\
      <tr>\
        <th>Request URL:</th>\
      <td>%s</td>\
      </tr>\
    </table>\
  </div>\
  <div id="info">\
    <p>%s</p>\
  </div>\
\
  <div id="explanation">\
    <p>\
    You are seeing this error because you use <code>Jack.ShowStatus</code>.\
    </p>\
  </div>\
</body>\
</html>';
