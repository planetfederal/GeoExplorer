var assert = require("assert");
var fs = require("fs");
var maps = require("../../app/maps");

var db;
exports.setUp = function() {
    db = maps.getDb();
}

exports.tearDown = function() {
    fs.remove(db);
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
