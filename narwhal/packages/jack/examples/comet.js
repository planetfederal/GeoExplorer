var Jack = require("jack");

function MessageQueue() {
    this.lock = new java.util.concurrent.locks.ReentrantLock();
    this.notEmpty = this.lock.newCondition(); 
    this.items = [];
}

MessageQueue.prototype.put = function(x) {
    this.lock.lock();
    try {
        this.items.push(x);
        this.notEmpty.signal();
    } finally {
        this.lock.unlock();
    }
}

MessageQueue.prototype.take = function() {
    this.lock.lock();
    try {
        while (this.items.length === 0) 
            this.notEmpty.await();
        return this.items.shift();
    } finally {
        this.lock.unlock();
    }
}

var queues = [];

var map = {};

map["/"] = function(env) {
    var req = new Jack.Request(env)
        res = new Jack.Response(),
        message = req.params("message");
    
    if (message) {
        for (var i = 0; i < queues.length; i++)
            queues[i].put(message);

        res.write("sent '" + message + "' to " + queues.length + " clients");
    }
    
    res.write('<form action="" method="post">');
    res.write('<input type="text" name="message" value="'+(message||"")+'">');
    res.write('<input type="submit" value="Send">');
    res.write('</form>');
    
    res.write('<a href="listen">listen</a>');
        
    return res.finish();
}

map["/listen"] = function(env) {
    var res = new Jack.Response(200, {"Transfer-Encoding":"chunked"});
    return res.finish(function(response) {
        
        // HACK: Safari doesn't display chunked data until a certain number of bytes
        for (var i = 0; i < 10; i++)
            response.write("................................................................................................................................<br />"); 
        
        var q = new MessageQueue();
        queues.push(q);
            
        while (true) {
            var message = q.take();
            response.write("received: " + message + "<br />");
        }
    });
}




// apply the URLMap
exports.app = Jack.ContentLength(Jack.URLMap(map));
