/**
 * Copyright (c) 2009 The Open Planning Project
 */

Ext.namespace("GeoExplorer.plugins");

GeoExplorer.plugins.GoogleMaps = {
    store: null,
    mapTypes: null,
    
    init: function(app) {
        var plugin = GeoExplorer.plugins.GoogleMaps;

        //TODO add dynamic key
        plugin.store || plugin.loadScript();

        app.serviceType["GoogleMaps"] = {
            prepare: function(done) {
                if(plugin.store) {
                    done()
                } else {
                    plugin.createStore(done);
                }
            },
            createLayer: function(config) {
                var cmp = function(l) {
                    return l.get("layer").type == window[config.layer];
                };
                // only return layer if app does not have it already
                if(this.layers.findBy(cmp) == -1) {
                    return plugin.store.getAt(plugin.store.findBy(cmp));
                };
            }
        }
    },
    
    createStore: function(done) {
        if(!window.G_NORMAL_MAP) {
            window.setTimeout(function() {
                GeoExplorer.plugins.GoogleMaps.createStore(done);
            }, 100);
            return;
        }

        var plugin = GeoExplorer.plugins.GoogleMaps;
        var mapTypes = [G_NORMAL_MAP, G_SATELLITE_MAP, G_HYBRID_MAP, G_PHYSICAL_MAP];
        var len = mapTypes.length;
        var layers = new Array(len);
        var mapType;
        for(var i=0; i<len; ++i) {
            mapType = mapTypes[i];
            layers[i] = new OpenLayers.Layer.Google(
                "Google " + mapType.getName(), {
                    type: mapType,
                    sphericalMercator: true,
                    maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
                    restrictedExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34)
                }
            )
        }
        plugin.store = new GeoExt.data.LayerStore({
            layers: layers,
            fields: [
                {name: "abstract", type: "string"},
                {name: "group", type: "string"}
            ]
        });
        plugin.store.each(function(l) {
            l.set("group", "background");
            l.set("abstract", l.get("layer").type.getAlt());
        });
        done();
    },
    
    loadScript: function() {
        var _write = document.write;
        document.write = function(script){
            gxp.util.loadScript(/src=\"(.[^\"]*)\"/.exec(script)[1]);
        }
        gxp.util.loadScript(
            "http://maps.google.com/maps?file=api&amp;v=2&amp;key=" +
            this.apiKey, function() {
                document.write = _write;
            }, null, {charset: "UTF-8"}
        );
    }    
}
