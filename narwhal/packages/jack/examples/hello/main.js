
var ContentLength = require('jack/contentlength').ContentLength;

exports.app = new ContentLength(function (env) {
    return {
        status : 200,
        headers : {"content-type": "text/plain"},
        body : ["Hello, World!"]
    };
});

if (require.main == module.id)
    require("jackup").main(system.args.concat([module.id]));

