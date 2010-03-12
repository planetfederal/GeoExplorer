var SQLITE = require("jdbc/sqlite");
var Request = require("jack/request").Request;
var responseForStatus = require("jack/utils").responseForStatus;

// TODO: configure path to db
var db = "geoexplorer.db";

// set up maps table
var connection = SQLITE.open(db);
var statement = connection.createStatement();
statement.executeUpdate(
    "CREATE TABLE IF NOT EXISTS maps (" + 
        "id INTEGER PRIMARY KEY ASC, config BLOB" +
    ");"
);
connection.close();

var success = function(data) {
    if (typeof data !== "string") {
        data = JSON.encode(data);
    }
    return {
        status: 200,
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
            resp = success({ids: ids});
        } else if (id === false) {
            // invalid id
            resp = responseForStatus(400, "Invalid map id.");
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
                resp = success(String(results.getString("config")));
            } else {
                // not found
                resp = responseForStatus(404, "No map with id " + id);
            }
            results.close();
            connection.close();
        }
        return resp;
    },
    "POST": function(env) {
        var id = getId(env);
        if (id !== null) {
            resp = responseForStatus(405, "Can't POST to map " + id);
        } else {
            var config = getConfig(env);
            if (!config) {
                resp = responseForStatus(400, "Bad map config.");
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
                resp = success({id: id});
            }
        }
        return resp;
    },
    "PUT": function(env) {
        var resp;
        var id = getId(env);
        if (id === null) {
            resp = responseForStatus(405, "Can't PUT without map id.");
        } else if (id === false) {
            resp = responseForStatus(400, "Invalid map id.");
        } else {
            // valid map id
            var config = getConfig(env);
            if (!config) {
                resp = responseForStatus(400, "Bad map config.");
            } else {
                var connection = SQLITE.open(db);
                var prep = connection.prepareStatement(
                    "UPDATE OR FAIL maps SET config = ? WHERE id = ?;"
                );
                prep.setString(1, config);
                prep.setInt(2, id);
                var rows = prep.executeUpdate();
                if (!rows) {
                    resp = responseForStatus(404, "No map with id " + id);
                } else {
                    resp = success(config);
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
            resp = responseForStatus(405, "Can't DELETE without map id.");
        } else if (id === false) {
            resp = responseForStatus(400, "Invalid map id.");
        } else {
            var connection = SQLITE.open(db);
            var prep = connection.prepareStatement(
                "DELETE FROM maps WHERE id = ?;"
            );
            prep.setInt(1, id);
            var rows = prep.executeUpdate();
            if (!rows) {
                resp = responseForStatus(404, "No map with id " + id);
            } else {
                resp = success({id: id});
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
        resp = responseForStatus(405, method);
    }
    return resp;    
};
