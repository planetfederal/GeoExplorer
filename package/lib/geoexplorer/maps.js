var SQLITE = require("../sqlite");
var Request = require("jack/request").Request;
var FILE = require("file");

// GEOEXPLORER_DATA can be an init-param for the servlet or an environment var
var dataDir = global["GEOEXPLORER_DATA"] || String(Packages.java.lang.System.getenv("GEOEXPLORER_DATA") || ".");
var db = FILE.join(dataDir, "geoexplorer.db");

// set up maps table
try {
    var connection = SQLITE.open(db);
} catch (err) {
    // TODO: nicer exception handling - this is hard for the user to find
    throw "Can't open '" + db + "' for writing.  Set GEOEXPLORER_DATA to a writable directory.";
}
var statement = connection.createStatement();
statement.executeUpdate(
    "CREATE TABLE IF NOT EXISTS maps (" + 
        "id INTEGER PRIMARY KEY ASC, config BLOB" +
    ");"
);
connection.close();

var createResponse = function(data, status) {
    if (typeof data !== "string") {
        data = JSON.encode(data);
    }
    return {
        status: status || 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: [data]
    };
};

var getConfig = function(env) {
    var request = new Request(env);
    var config = request.body().decodeToString(request.contentCharset() || "utf-8");
    var obj;
    try {
        obj = JSON.decode(config);
    } catch (err) {
        config = null;
    }
    if (typeof obj !== "object" || Array.isArray(obj)) {
        config = null;
    }
    return config;
};

var getId = function(env) {
    var id = env["PATH_INFO"].split("/")[1];
    if (!id) {
        // null means no id
        id = null;
    } else {
        id = Number(id);
        if (isNaN(id)) {
            // false means invalid id
            id = false;
        }
    }
    return id;
};

var handlers = {
    "GET": function(env) {
        var id = getId(env);
        var resp;
        if (id === null) {
            // retrieve all map identifiers
            var connection = SQLITE.open(db);
            var statement = connection.createStatement();
            var results = statement.executeQuery(
                "SELECT id FROM maps;"
            );
            var ids = [];
            while (results.next()) {
                ids.push(results.getInt("id"));
            }
            results.close();
            connection.close();
            // return all ids
            resp = createResponse({ids: ids});
        } else if (id === false) {
            // invalid id
            resp = createResponse({error: "Invalid map id."}, 400);
        } else {
            // retrieve single map config
            var connection = SQLITE.open(db);
            var prep = connection.prepareStatement(
                "SELECT config FROM maps WHERE id = ?;"
            );
            prep.setInt(1, id);
            var results = prep.executeQuery();
            if (results.next()) {
                // found map by id
                resp = createResponse(String(results.getString("config")));
            } else {
                // not found
                resp = createResponse({error: "No map with id " + id}, 404);
            }
            results.close();
            connection.close();
        }
        return resp;
    },
    "POST": function(env) {
        var id = getId(env);
        if (id !== null) {
            resp = createResponse({error: "Can't POST to map " + id}, 405);
        } else {
            var config = getConfig(env);
            if (!config) {
                resp = createResponse({error: "Bad map config."}, 400);
            } else {
                var connection = SQLITE.open(db);
                // store the new map config
                var prep = connection.prepareStatement(
                    "INSERT INTO maps (config) VALUES (?);"
                );
                prep.setString(1, config);
                prep.executeUpdate();
                // get the map id
                var statement = connection.createStatement();
                var results = statement.executeQuery("SELECT last_insert_rowid() AS id;");
                results.next();
                var id = Number(results.getInt("id"));
                results.close();
                connection.close();
                // return the map id
                resp = createResponse({id: id});
            }
        }
        return resp;
    },
    "PUT": function(env) {
        var resp;
        var id = getId(env);
        if (id === null) {
            resp = createResponse({error: "Can't PUT without map id."}, 405);
        } else if (id === false) {
            resp = createResponse({error: "Invalid map id."}, 400);
        } else {
            // valid map id
            var config = getConfig(env);
            if (!config) {
                resp = createResponse({error: "Bad map config."}, 400);
            } else {
                var connection = SQLITE.open(db);
                var prep = connection.prepareStatement(
                    "UPDATE OR FAIL maps SET config = ? WHERE id = ?;"
                );
                prep.setString(1, config);
                prep.setInt(2, id);
                var rows = prep.executeUpdate();
                if (!rows) {
                    resp = createResponse({error: "No map with id " + id}, 404);
                } else {
                    resp = createResponse(config);
                }
                connection.close();
            }
        }
        return resp;
    },
    "DELETE": function(env) {
        var resp;
        var id = getId(env);
        if (id === null) {
            resp = createResponse({error: "Can't DELETE without map id."}, 405);
        } else if (id === false) {
            resp = createResponse({error: "Invalid map id."}, 400);
        } else {
            var connection = SQLITE.open(db);
            var prep = connection.prepareStatement(
                "DELETE FROM maps WHERE id = ?;"
            );
            prep.setInt(1, id);
            var rows = prep.executeUpdate();
            if (!rows) {
                resp = createResponse({error: "No map with id " + id}, 404);
            } else {
                resp = createResponse({id: id});
            }
            connection.close();
        }
        return resp;
    }
};

exports.app = function(env) {
    var resp;
    var method = env["REQUEST_METHOD"];
    var handler = handlers[method];
    if (handler) {
        resp = handler(env);
    } else {
        resp = createResponse({error: "Not allowed: " + method}, 405);
    }
    return resp;    
};
