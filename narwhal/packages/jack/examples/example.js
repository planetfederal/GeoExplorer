var Jack = require("jack");

var map = {};

// an extremely simple Jack application
map["/hello"] = function(env) {
    return {
        status : 200,
        headers : {"Content-Type":"text/plain"},
        body : ["Hello from " + env["SCRIPT_NAME"]]
    };
}

// 1/6th the time this app will throw an exception
map["/httproulette"] = function(env) {
    // if you have the ShowExceptions middleware in the pipeline it will print the error.
    // otherwise the server/handler will print something
    if (Math.random() > 5/6)
        throw new Error("bam!");
    
    return {
        status : 200,
        headers : {"Content-Type":"text/html"},
        body : ['whew!<br /><a href="httproulette">try again</a>']
    };
}

var form = '<form action="" method="get"><input type="text" name="name" value="" id="some_name"><input type="submit" value="go"></p></form>';

// an index page demonstrating using a Response object
map["/"] = function(env) {
    var request = new Jack.Request(env),
        response = new Jack.Response();

    response.write('hello ' + (request.GET("name") || form) +"<br />");
        
    response.write('<a href="hello">hello</a><br />');
    response.write('<a href="httproulette">httproulette</a><br />');
    response.write('<a href="narwhal">narwhal</a><br />');
    response.write('<a href="stream">stream</a><br />');
    response.write('<a href="stream1">stream1</a><br />');
    response.write('<a href="cookie">cookie</a><br />');
    response.write('<a href="examples">examples</a><br />');
    response.write('<a href="info">info</a><br />');

    return response.finish();
}

map["/narwhal"] = Jack.Narwhal;

// use the JSONP middleware on this one
map["/jsontest"] = Jack.JSONP(function(env) {
    return {
        status : 200,
        headers : { "Content-Type" : "application/json" },
        body : ["{ \"hello\" : \"world\" }"]
    };
});

map["/files"] = Jack.File(".");

map["/stream"] = function(env) {
    return {
        status : 200,
        headers : {"Content-Type":"text/html", "Transfer-Encoding":"chunked"},
        body : { forEach : function(write) {
            for (var i = 0; i < 50; i++) { 
                java.lang.Thread.currentThread().sleep(100); 
                write("hellohellohellohellohellohellohellohellohellohellohellohellohello<br />"); 
            }
        }}
    };
}


map["/stream1"] = function(env) {
    var res = new Jack.Response(200, {"Transfer-Encoding":"chunked"});
    return res.finish(function(response) {
        for (var i = 0; i < 50; i++) { 
            java.lang.Thread.currentThread().sleep(100); 
            response.write("hellohellohellohellohellohellohellohellohellohellohellohellohello<br />"); 
        }
    });
}

map["/cookie"] = function(env) {
    var request = new Jack.Request(env),
        response = new Jack.Response();
        
    var name = request.POST("name");
    
    if (typeof name === "string") {
        response.write("setting name: " + name + "<br />");
        response.setCookie("name", name);
    }
    
    var cookies = request.cookies();
    if (cookies["name"])
        response.write("previously saved name: " + cookies["name"] +"<br />")
        
    response.write('<form action="cookie" method="post" enctype="multipart/form-data">');
    response.write('<input type="text" name="name" value="" id="some_name">');
    response.write('<input type="submit" value="go"></form>');
    
    return response.finish();
}

map["/info"] = function(env) {
    var request = new Jack.Request(env),
        response = new Jack.Response(200, { "Content-Type" : "text/plain" });
    
    var params = request.params();
    
    response.write("========================= params =========================\n");
    
    for (var i in params)
        response.write(i + "=>" + params[i] + "\n")
    
    response.write("========================= env =========================\n");
    
    for (var i in env)
        response.write(i + "=>" + env[i] + "\n")
    
    response.write("========================= system.env =========================\n");
    
    for (var i in system.env)
        response.write(i + "=>" + system.env[i] + "\n")

    return response.finish();
}

map["/examples"] = Jack.Directory(".");

// middleware:

// apply the URLMap
exports.app = Jack.ContentLength(Jack.URLMap(map));
