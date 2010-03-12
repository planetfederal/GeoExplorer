var Jack = exports;

Jack.Utils = require("jack/utils");

Jack.Mime = require("jack/mime");

var middleware = require("jack/middleware");
for (var name in middleware)
    Jack[name] = middleware[name];

Jack.Request = require("jack/request").Request;
Jack.Response = require("jack/response").Response;
    
Jack.Narwhal = require("jack/narwhal").app;
