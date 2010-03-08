var FastCGI = require("./fastcgi-"+system.engine);

for (var property in FastCGI)
    exports[property] = FastCGI[property];
