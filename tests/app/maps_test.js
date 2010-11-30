var assert = require("assert");
var fs = require("fs");
var maps = require("../../app/maps");

var System = Packages.java.lang.System;

var db, sysProp;
exports.setUp = function() {
    db = maps.getDb();
    sysProp = System.getProperty("GEOEXPLORER_DATA");
}

exports.tearDown = function() {
    fs.remove(db);
    if (sysProp) {
        System.setProperty("GEOEXPLORER_DATA", sysProp);
    } else {
        System.clearProperty("GEOEXPLORER_DATA");
    }
}

exports["test: create"] = function() {
    
    var config = {"test": "create"};
    var response = maps.createMap(config);
    assert.ok(response, "got a response");
    assert.ok("id" in response, "response includes map id");
    
};

exports["test: read"] = function() {
    
    var config = {"test": "read"};
    var response = maps.createMap(config);
    
    var got = maps.readMap(response.id);
    assert.deepEqual(got, config, "map config stored");

    assert.throws(function() {
        maps.readMap("xxx", config)
    }, Object, "reading with a bogus id throws");
    
};

exports["test: update"] = function() {
    
    var config = {"test": "update"};
    var response = maps.createMap(config);
    assert.deepEqual(maps.readMap(response.id), config, "map config stored");

    var updated = {"test": "updated!"};
    maps.updateMap(response.id, updated);
    var got = maps.readMap(response.id);
    assert.deepEqual(got, updated, "map config updated");

    assert.throws(function() {
        maps.updateMap("xxx", config)
    }, Object, "updating with a bogus id throws");
    
};

exports["test: delete"] = function() {
    
    var config = {"test": "delete"};
    var response = maps.createMap(config);
    
    var {ids} = maps.getMapIds();
    assert.ok(ids.indexOf(response.id) > -1, "map index in list before delete");

    maps.deleteMap(response.id);
    var {ids} = maps.getMapIds();
    assert.ok(ids.indexOf(response.id) < 0, "map index not in list after delete")
    
    assert.throws(function() {
        maps.readMap(response.id)
    }, Object, "reading from a deleted id throws");
    
};

function mockRequest(dataDir) {
    return {
        env: {
            servlet: {
                getServletConfig: function() {
                    return {
                        getInitParameter: function(name) {
                            return dataDir;
                        }
                    };
                }
            }
        }
    };
}

exports["test: getDb(default)"] = function() {
    var got = maps.getDb();
    var exp = fs.join(fs.workingDirectory(), "geoexplorer.db");
    assert.equal(fs.canonical(got), fs.canonical(exp), "db location ./geoexplorer.db by default")
};


exports["test: getDb(custom init parameter)"] = function() {

    var unwritable = fs.join(".", "nonexistent_directory");
    assert.throws(function() {
        maps.getDb(mockRequest(unwritable));
    }, Error, "GEOEXPLORER_DATA points to an unwritable or non-existent directory");

    var custom = fs.join(".", "path_to_data");
    fs.makeTree(custom);
    var got = maps.getDb(mockRequest(custom));
    fs.removeTree(custom);
    var exp = fs.join(custom, "geoexplorer.db");
    assert.equal(fs.canonical(got), fs.canonical(exp), "custom db location set with GEOEXPLORER_DATA init parameter");
    
    
};

exports["test: getDb(custom system property)"] = function() {

    var unwritable = fs.join(".", "nonexistent_directory");
    System.setProperty("GEOEXPLORER_DATA", unwritable);
    assert.throws(function() {
        maps.getDb();
    }, Error, "GEOEXPLORER_DATA points to an unwritable or non-existent directory");

    var custom = fs.join(".", "path_to_data");
    fs.makeTree(custom);
    System.setProperty("GEOEXPLORER_DATA", custom);
    var got = maps.getDb();
    fs.removeTree(custom);
    var exp = fs.join(custom, "geoexplorer.db");
    assert.equal(fs.canonical(got), fs.canonical(exp), "custom db location set with GEOEXPLORER_DATA system property");
    
};

exports["test: getDb(precedence)"] = function() {

    var sys = fs.join(".", "system_property");
    fs.makeTree(sys);
    System.setProperty("GEOEXPLORER_DATA", sys);

    var init = fs.join(".", "init_parameter");
    fs.makeTree(init);
    var request = mockRequest(init);
    
    var got = maps.getDb(request);

    fs.removeTree(sys);
    fs.removeTree(init);

    var exp = fs.join(init, "geoexplorer.db");
    assert.equal(fs.canonical(got), fs.canonical(exp), "init parameter gets precedence over system property");
    
};

