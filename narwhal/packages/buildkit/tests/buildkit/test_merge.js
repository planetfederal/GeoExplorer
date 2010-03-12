var ASSERT = require("test/assert");
var MERGE = require("buildkit/merge");

var assets = {
    
    "pet/dog/chiwawa" : {includes: {"trick/tailwag": true}, requires: {"pet/dog": true}},
    
    "trick/tailwag": {includes: {}, requires: {"trick": true}},
    
    "pet/dog": {includes: {"trick/tailwag": true}, requires: {"pet": true}},

    "pet": {includes: {}, requires: {}},
    
    "trick": {includes: {}, requires: {}},

    "pet/cat/manx": {includes: {}, requires: {"pet/cat": true}},
    
    "pet/cat": {includes: {}, requires: {"pet": true}}
    
};


exports["test: _getOrderedAssets (all)"] = function() {


    var first = [];
    var include = [];
    var exclude = [];
    var last = [];
    var ordered = MERGE._getOrderedAssets(first, include, exclude, last, assets);
    
    var count = 0;
    for (var path in assets) {
        ++count;
        ASSERT.isTrue(ordered.indexOf(path) >= 0, path + " in ordered");
    }
    ASSERT.is(count, ordered.length, "correct ordered length");
    
    ASSERT.isTrue(ordered.indexOf("pet") < ordered.indexOf("pet/dog"), "pet before pet/dog");
    ASSERT.isTrue(ordered.indexOf("pet/dog") < ordered.indexOf("pet/dog/chiwawa"), "pet/dog before pet/dog/chiwawa");
    
    ASSERT.isTrue(ordered.indexOf("pet") < ordered.indexOf("pet/cat"), "pet before pet/cat");
    ASSERT.isTrue(ordered.indexOf("pet/cat") < ordered.indexOf("pet/cat/manx"), "pet/cat before pet/cat/manx");
    
    ASSERT.isTrue(ordered.indexOf("trick") < ordered.indexOf("trick/tailwag"), "trick before trick/tailwag");

};

exports["test: _getOrderedAssets (first)"] = function() {

    var first = ["trick"];
    var include = ["pet/dog/chiwawa"];
    var exclude = [];
    var last = [];
    var ordered = MERGE._getOrderedAssets(first, include, exclude, last, assets);
    
    ASSERT.is(-1, ordered.indexOf("pet/cat"), "no pat/cat here");
    
    ASSERT.isTrue(ordered.indexOf("pet") < ordered.indexOf("pet/dog"), "pet before pet/dog");
    ASSERT.isTrue(ordered.indexOf("pet/dog") < ordered.indexOf("pet/dog/chiwawa"), "pet/dog before pet/dog/chiwawa");
    
    ASSERT.isTrue(ordered.indexOf("trick/tailwag") >= 0, "trick/tailwag included by default");
    ASSERT.is(0, ordered.indexOf("trick"), "trick first");
	
    var first = ["pet"];
    var include = ["pet/dog/chiwawa"];
    var exclude = [];
    var last = [];
    var ordered = MERGE._getOrderedAssets(first, include, exclude, last, assets);
    
    ASSERT.is(-1, ordered.indexOf("pet/cat"), "no pat/cat here");
    
    ASSERT.isTrue(ordered.indexOf("pet") < ordered.indexOf("pet/dog"), "pet before pet/dog");
    ASSERT.isTrue(ordered.indexOf("pet/dog") < ordered.indexOf("pet/dog/chiwawa"), "pet/dog before pet/dog/chiwawa");
    
    ASSERT.isTrue(ordered.indexOf("trick/tailwag") >= 0, "trick/tailwag included by default");
    ASSERT.isTrue(ordered.indexOf("trick") < ordered.indexOf("trick/tailwag"), "trick before trick/tailwag");

    ASSERT.is(0, ordered.indexOf("pet"), "pet first");

};

exports["test: _getOrderedAssets (include)"] = function() {

    var first = [];
    var include = ["pet/dog/chiwawa"];
    var exclude = [];
    var last = [];
    var ordered = MERGE._getOrderedAssets(first, include, exclude, last, assets);
    
    ASSERT.is(-1, ordered.indexOf("pet/cat"), "no pat/cat here");
    
    ASSERT.isTrue(ordered.indexOf("pet") < ordered.indexOf("pet/dog"), "pet before pet/dog");
    ASSERT.isTrue(ordered.indexOf("pet/dog") < ordered.indexOf("pet/dog/chiwawa"), "pet/dog before pet/dog/chiwawa");
    
    ASSERT.isTrue(ordered.indexOf("trick/tailwag") >= 0, "trick/tailwag included by default");
    ASSERT.isTrue(ordered.indexOf("trick") < ordered.indexOf("trick/tailwag"), "trick before trick/tailwag");
	
};

exports["test: _getOrderedAssets (exclude)"] = function() {

    var first = [];
    var include = ["pet/dog/chiwawa"];
    var exclude = ["trick/tailwag"];
    var last = [];
    var ordered = MERGE._getOrderedAssets(first, include, exclude, last, assets);
    
    ASSERT.is(-1, ordered.indexOf("pet/cat"), "no pat/cat here");
    
    ASSERT.isTrue(ordered.indexOf("pet") < ordered.indexOf("pet/dog"), "pet before pet/dog");
    ASSERT.isTrue(ordered.indexOf("pet/dog") < ordered.indexOf("pet/dog/chiwawa"), "pet/dog before pet/dog/chiwawa");
    
    ASSERT.is(-1, ordered.indexOf("trick/tailwag"), "trick/tailwag excluded");
    ASSERT.is(-1, ordered.indexOf("trick"), "no trick");
	
};

exports["test: _getOrderedAssets (last)"] = function() {

    var first = [];
    var include = [];
    var exclude = [];
    var last = ["pet/cat/manx"];
    var ordered = MERGE._getOrderedAssets(first, include, exclude, last, assets);
    
    var count = 0;
    for (var path in assets) {
        ++count;
        ASSERT.isTrue(ordered.indexOf(path) >= 0, path + " in ordered");
    }
    ASSERT.is(count, ordered.length, "correct ordered length");
    
    ASSERT.isTrue(ordered.indexOf("pet") < ordered.indexOf("pet/dog"), "pet before pet/dog");
    ASSERT.isTrue(ordered.indexOf("pet/dog") < ordered.indexOf("pet/dog/chiwawa"), "pet/dog before pet/dog/chiwawa");
    
    ASSERT.isTrue(ordered.indexOf("pet") < ordered.indexOf("pet/cat"), "pet before pet/cat");
    ASSERT.isTrue(ordered.indexOf("pet/cat") < ordered.indexOf("pet/cat/manx"), "pet/cat before pet/cat/manx");
    
    ASSERT.isTrue(ordered.indexOf("trick") < ordered.indexOf("trick/tailwag"), "trick before trick/tailwag");
    
    ASSERT.is(count-1, ordered.indexOf("pet/cat/manx"), "pet/cat/manx last");

};

exports["test: _getOrderedAssets (circular)"] = function() {
    
    var circular = {
        "happiness": {requires: {"money": true}},
        "money": {requires: {"happiness": true}}
    };
    
    var first = [];
    var include = [];
    var exclude = [];
    var last = [];
    var ordered = MERGE._getOrderedAssets(first, include, exclude, last, circular);
    
    ASSERT.is(2, ordered.length, "correct ordered length");

    var first = ["happiness"];
    var include = [];
    var exclude = [];
    var last = [];
    var ordered = MERGE._getOrderedAssets(first, include, exclude, last, circular);

    ASSERT.is(0, ordered.indexOf("happiness"), "happiness first");


    var first = ["money"];
    var include = [];
    var exclude = [];
    var last = [];
    var ordered = MERGE._getOrderedAssets(first, include, exclude, last, circular);

    ASSERT.is(0, ordered.indexOf("money"), "money first");

};

if (require.main == module) {
    require("test/runner").run(exports);
}

