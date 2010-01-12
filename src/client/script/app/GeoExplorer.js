/**
 * Copyright (c) 2009 The Open Planning Project
 */

/**
 * api: (define)
 * module = GeoExplorer
 * extends = Ext.Observable
 */

/** api: constructor
 *  .. class:: GeoExplorer(config)
 *     Create a new GeoExplorer application.
 *
 *     Parameters:
 *     config - {Object} Optional application configuration properties.
 *
 *     Valid config properties:
 *     map - {Object} Map configuration object.
 *     sources - {Object} An object with properties whose values are WMS endpoint URLs
 *     alignToGrid - {boolean} if true, align tile requests to the grid 
 *         enforced by tile caches such as GeoWebCache or Tilecache
 *
 *     Valid map config properties:
 *         projection - {String} EPSG:xxxx
 *         units - {String} map units according to the projection
 *         maxResolution - {Number}
 *         layers - {Array} A list of layer configuration objects.
 *         center - {Array} A two item array with center coordinates.
 *         zoom - {Number} An initial zoom level.
 *
 *     Valid layer config properties (WMS):
 *     name - {String} Required WMS layer name.
 *     title - {String} Optional title to display for layer.
 */
var GeoExplorer = Ext.extend(Ext.util.Observable, {
    
    /**
     * private: property[mapPanel]
     * the :class:`GeoExt.MapPanel` instance for the main viewport
     */
    mapPanel: null,

    /**
     * api: config[alignToGrid]
     * A boolean indicating whether or not to restrict tile request to tiled
     * mapping service recommendation.
     *
     * True => align to grid 
     * False => unrestrained tile requests
     */
    alignToGrid: false,
    
    /**
     * private: property[capGrid]
     * :class:`Ext.Window` The window containing the CapabilitiesGrid panel to 
     * use when the user is adding new layers to the map.
     */
    capGrid: null,

    /**
     * private: property[popupCache]
     * :class:`Object` An object containing references to visible popups so that
     * we can insert responses from multiple requests.
     *
     * ..seealso:: :method:`GeoExplorer.displayPopup()`
     */
    popupCache: null,
    
    /** api: property[layerSources]
     *  A :class:`Ext.data.Store` containing one 
     *  :class:`GeoExt.data.WMSCapabilitiesStore` for each WMS service in use by
     *  the application, along with service-specific metadata like the service 
     *  name.
     */
    layerSources: null,
        
    constructor: function(config) {

        // add any custom application events
        this.addEvents(
            /**
             * Event: ready
             * Fires when application is ready for user interaction.
             */
            "ready"
        );

        this.popupCache = {};

        this.layerSources = new Ext.data.SimpleStore({
            fields: ["identifier", "name", "store", "url"],
            data: []
        });
        
        var mapId = window.location.hash.substr(1);
        if (mapId) {
            OpenLayers.Request.GET({
                url: mapId,
                callback: function(request) {
                    var addConfig = Ext.util.JSON.decode(request.responseText);
                    this.applyConfig(Ext.applyIf(addConfig, config));
                },
                scope: this
            });
        } else {
            var query = Ext.urlDecode(document.location.search.substr(1));
            if (query && query.q) {
                var queryConfig = Ext.util.JSON.decode(query.q);
                Ext.apply(config, queryConfig);
            }
            this.applyConfig(config);
        }
        
    },
    
    applyConfig: function(config) {
        this.initialConfig = Ext.apply({}, config);
        Ext.apply(this, this.initialConfig);
        this.load();
    },

    /**
     * private: method[load]
     * Called at the end of construction.  This initiates the sequence that
     * prepares the application for use, including tasks such as loading 
     * capabilities from remote servers, populating the map, etc.
     */
    load: function() {

        // pass on any proxy config to OpenLayers
        if(this.proxy) {
            OpenLayers.ProxyHost = this.proxy;
        }

        var dispatchQueue = [
            // create layout as soon as Ext says ready
            function(done) {
                Ext.onReady(function() {
                    this.createLayout();
                    done();
                }, this);
            }
        ];
        
        for (var id in this.sources) {
            // Load capabilities for each sources passed through the configuration.
            dispatchQueue.push(
                (function(id) {
                    // Create a new scope for 'id'.
                    return function(done){
                        this.addSource(this.sources[id], id, done, done);
                    }; 
                })(id));
        }
        
        gxp.util.dispatch(
            dispatchQueue,
            
            // activate app when the above are both done
            this.activate, 
            this);
    },
    
    /** private: method[addSource]
     * Add a new WMS server to GeoExplorer. The id parameter is optional,
     * and will be given a default if not specified; success and fail 
     * are also optional, and scope only applies if success or fail
     * is passed in.
     */
    addSource: function(url, id, success, fail, scope) {
        scope = scope || this;
        success = OpenLayers.Function.bind(success, scope);
        fail = OpenLayers.Function.bind(fail, scope);
        
        id = id || OpenLayers.Util.createUniqueID("source");
        var capsURL = this.createWMSCapabilitiesURL(url);
                        var store = new GeoExt.data.WMSCapabilitiesStore();

        OpenLayers.Request.GET({
            proxy: this.proxy, 
            url: capsURL,
            success: function(request){
                var store = new GeoExt.data.WMSCapabilitiesStore({
                            fields:  [
                                {name: "name", type: "string"},
                                {name: "title", type: "string"},
                                {name: "abstract", type: "string"},
                                {name: "queryable", type: "boolean"},
                                {name: "formats"},
                                {name: "styles"},
                                {name: "llbbox"},
                                {name: "minScale"},
                                {name: "maxScale"},
                                {name: "prefix"},
                                
                                // Added for GeoExplorer.
                                {name: "group", type: "string"},
                                {name: "source_id", type: "string"}
                            ]
                        });
                var xml = request.responseXML;
                var data = (xml && xml.documentElement) ?
                    xml : request.responseText;
                
                try {
                    // Read the response. It's important to note that the
                    // WMSCapabilitiesStore reads the data as well, though
                    // we need to do it ourselves in order to maintain
                    // low coupling.
                    var format = new OpenLayers.Format.WMSCapabilities();
                    var extractedData = format.read(data);
                    
                    store.loadData(data);
                } catch(err) {
                    OpenLayers.Console.error("Could not load source: " + url);
                    fail();
                    return;
                }
                
                // MODERATELY LARGE DIRTY HACK!
                // Tell each layer where it came from.
                store.each(function(record) {
                    record.set("source_id", id);
                }, this);
                
                var record = new this.layerSources.recordType({
                    url: url,
                    store: store,
                    identifier: id,
                    name: extractedData.service.title || id
                });
                
                this.layerSources.add(record);
                success(record);
            },
            failure: function(){
                OpenLayers.Console.error("Couldn't get capabilities document for sources '" + id + "'.");
                fail();
            },
            scope: this
        });
    },
    
    /** private: method[createWMSCapabilitiesURL]
     * Given the URL to an OWS service endpoint, generate a GET request URL for
     * the service's WMS capabilities.
     */
    createWMSCapabilitiesURL: function(url) {
        var args = {
            SERVICE: "WMS",
            REQUEST: "GetCapabilities",
            VERSION: "1.1.1"
        };
        var argIndex = url.indexOf("?");
        if(argIndex > -1) {
            var params = OpenLayers.Util.getParameters(url);
            // merge, favoring those here
            var merged = {}, ukey;
            for (var key in params) {
                ukey = key.toUpperCase();
                if (!(ukey in args)) {
                    merged[key] = params[key];
                }
            }
            url = url.substring(0, argIndex + 1) + Ext.urlEncode(Ext.apply(merged, args));
        } else {
            url = url + "?" + Ext.urlEncode(args);
        }

        return url;
    },
    
    /** private: method[createLayout]
     * Create the various parts that compose the layout.
     */
    createLayout: function() {
        
        this.createMap();
        
        var addLayerButton = new Ext.Button({
            tooltip : "Add Layers",
            disabled: true,
            iconCls: "icon-addlayers",
            handler : this.showCapabilitiesGrid,
            scope: this
        });
        this.on("ready", function() {addLayerButton.enable();});

        var getSelectedLayerRecord = function() {
            var node = layerTree.getSelectionModel().getSelectedNode();
            var record;
            if(node && node.layer) {
                var layer = node.layer;
                var store = node.layerStore;
                record = store.getAt(store.findBy(function(record) {
                    return record.get("layer") === layer;
                }));
            }
            return record;
        };

        var removeLayerAction = new Ext.Action({
            text: "Remove Layer",
            iconCls: "icon-removelayers",
            disabled: true,
            tooltip: "Remove Layer",
            handler: function() {
                var record = getSelectedLayerRecord();
                if(record) {
                    this.mapPanel.layers.remove(record);
                    removeLayerAction.disable();
                }
            },
            scope: this
        });

        var treeRoot = new Ext.tree.TreeNode({
            text: "Layers",
            expanded: true,
            isTarget: false,
            allowDrop: false
        });
        treeRoot.appendChild(new GeoExt.tree.LayerContainer({
            text: "Overlays",
            iconCls: "gx-folder",
            expanded: true,
            loader: new GeoExt.tree.LayerLoader({
                store: this.mapPanel.layers,
                filter: function(record) {
                    return !record.get("group") &&
                        record.get("layer").displayInLayerSwitcher == true;
                }
            }),
            singleClickExpand: true,
            allowDrag: false,
            listeners: {
                append: function(tree, node) {
                    node.expand();
                }
            }
        }));
        treeRoot.appendChild(new GeoExt.tree.LayerContainer({
            text: "Base Layers",
            iconCls: "gx-folder",
            expanded: true,
            group: "background",
            loader: new GeoExt.tree.LayerLoader({
                baseAttrs: {checkedGroup: "background"},
                store: this.mapPanel.layers,
                filter: function(record) {
                    return record.get("group") === "background" &&
                        record.get("layer").displayInLayerSwitcher == true;
                }
            }),
            singleClickExpand: true,
            allowDrag: false,
            listeners: {
                append: function(tree, node) {
                    node.expand();
                }
            }
        }));
        
        var layerPropertiesDialog;
        var showPropertiesAction = new Ext.Action({
            text: "Layer Properties",
            iconCls: "icon-properties",
            disabled: true,
            tooltip: "Layer Properties",
            handler: function() {
                var record = getSelectedLayerRecord();
                if(record) {
                    if(layerPropertiesDialog) {
                        layerPropertiesDialog.close();
                    }
                    layerPropertiesDialog = new Ext.Window({
                        title: "Layer Properties: " + record.get("title"),
                        width: 250,
                        height: 250,
                        layout: "fit",
                        items: [{
                            xtype: "gx_wmslayerpanel",
                            layerRecord: record,
                            defaults: {style: "padding: 10px"}
                        }]
                    });
                    layerPropertiesDialog.show();
                }
            }
        });
        
        var updateLayerActions = function(sel, node) {
            if(node && node.layer) {
                // allow removal if more than one non-vector layer
                var count = this.mapPanel.layers.queryBy(function(r) {
                    return !(r.get("layer") instanceof OpenLayers.Layer.Vector);
                }).getCount();
                if(count > 1) {
                    removeLayerAction.enable();
                } else {
                    removeLayerAction.disable();
                }
                showPropertiesAction.enable();
            } else {
                removeLayerAction.disable();
                showPropertiesAction.disable();
            }
        };

        var layerTree = new Ext.tree.TreePanel({
            root: treeRoot,
            rootVisible: false,
            border: false,
            enableDD: true,
            selModel: new Ext.tree.DefaultSelectionModel({
                listeners: {
                    beforeselect: updateLayerActions,
                    scope: this
                }
            }),
            listeners: {
                contextmenu: function(node, e) {
                    if(node && node.layer) {
                        node.select();
                        var c = node.getOwnerTree().contextMenu;
                        c.contextNode = node;
                        c.showAt(e.getXY());
                    }
                },
                beforemovenode: function(tree, node, oldParent, newParent, index) {
                    // change the group when moving to a new container
                    if(oldParent !== newParent) {
                        var store = newParent.loader.store;
                        var index = store.findBy(function(r) {
                            return r.get("layer") === node.layer;
                        });
                        var record = store.getAt(index);
                        record.set("group", newParent.attributes.group);
                    }
                },                
                scope: this
            },
            contextMenu: new Ext.menu.Menu({
                items: [
                    {
                        text: "Zoom to Layer Extent",
                        iconCls: "icon-zoom-to",
                        handler: function() {
                            var node = layerTree.getSelectionModel().getSelectedNode();
                            if(node && node.layer) {
                                this.mapPanel.map.zoomToExtent(node.layer.restrictedExtent);
                            }
                        },
                        scope: this
                    },
                    removeLayerAction,
                    showPropertiesAction
                ]
            })
        });
        
        var layersContainer = new Ext.Panel({
            autoScroll: true,
            border: false,
            region: 'center',
            title: "Layers",
            items: [layerTree],
            tbar: [
                addLayerButton,
                Ext.apply(new Ext.Button(removeLayerAction), {text: ""}),
                Ext.apply(new Ext.Button(showPropertiesAction), {text: ""})
            ]
        });

        var legendContainer = new GeoExt.LegendPanel({
            title: "Legend",
            border: false,
            region: 'south',
            height: 200,
            collapsible: true,
            split: true,
            autoScroll: true,
            ascending: false,
            map: this.mapPanel.map,
            defaults: {cls: 'legend-item'}
        });        

        //  TODO: remove when http://trac.geoext.org/ticket/161 is closed
        //  START WORKAROUND FOR #161
        var oldGetLegendUrl = GeoExt.WMSLegend.prototype.getLegendUrl;
        GeoExt.WMSLegend.prototype.getLegendUrl = function() {
            var url = oldGetLegendUrl.apply(this, arguments);
            if (this.layer) {
                var param = "SCALE=" + (this.layer.map.getScale() | 0);
                if (url.indexOf("?") > -1) {
                    if (url.charAt(url.length - 1) === "&") {
                        url += param;
                    } else {
                        url += "&" + param;
                    }
                } else {
                    url += "?" + param;
                }
            }
            return url;
        };
        var updateLegend = function() {
            if (this.rendered && this.layer && this.layer.map) {
                this.updateLegend();
            }
        };
        legendContainer.on({
            beforeadd: function(panel, comp) {
                if (comp.items && comp.items.length > 1) {
                    var legend = comp.get(1);
                    if (legend.updateLegend) {
                        this.mapPanel.map.events.on({
                            zoomend: updateLegend,
                            scope: legend
                        });
                    }
                }
            },
            beforeremove: function(panel, comp) {
                if (comp.items && comp.items.length > 1) {
                    var legend = comp.get(1);
                    if (legend.updateLegend) {
                        this.mapPanel.map.events.un({
                            zoomend: updateLegend,
                            scope: legend
                        });
                    }
                }
            },
            scope: this
        });
        //  END WORKAROUND FOR #161

        var westPanel = new Ext.Panel({
            border: true,
            layout: "border",
            region: "west",
            width: 250,
            split: true,
            collapsible: true,
            collapseMode: "mini",
            items: [
                layersContainer, legendContainer
            ]
        });
        
        this.toolbar = new Ext.Toolbar({
            xtype: "toolbar",
            region: "north",
            disabled: true,
            items: this.createTools()
        });
        this.on("ready", function() {
            // enable only those items that were not specifically disabled
            var disabled = this.toolbar.items.filterBy(function(item) {
                return item.initialConfig && item.initialConfig.disabled;
            });
            this.toolbar.enable();
            disabled.each(function(item) {
                item.disable();
            });
        });

        var googleEarthPanel = new gxp.GoogleEarthPanel({
            mapPanel: this.mapPanel
        });

        googleEarthPanel.on("show", function() {
            if (layersContainer.rendered) {
                layersContainer.getTopToolbar().disable();
            }
            layerTree.getSelectionModel().un("beforeselect", updateLayerActions, this);
        }, this);

        googleEarthPanel.on("hide", function() {
            if (layersContainer.rendered) {
                layersContainer.getTopToolbar().enable();
            }
            var sel = layerTree.getSelectionModel();
            var node = sel.getSelectedNode();
            updateLayerActions.apply(this, [sel, node]);
            sel.on(
                "beforeselect", updateLayerActions, this
            );
        }, this);

        this.mapPanelContainer = new Ext.Panel({
            layout: "card",
            region: "center",
            defaults: {
                border: false
            },
            items: [
                this.mapPanel,
                googleEarthPanel
            ],
            activeItem: 0
        });
        
        var viewport = new Ext.Viewport({
            layout: "fit",
            hideBorders: true,
            items: {
                layout: "border",
                deferredRender: false,
                items: [
                    this.toolbar,
                    this.mapPanelContainer,
                    westPanel
                ]
            }
        });    
    },
    
    /** private: method[createMap]
     *  Create the map and place it in a map panel.
     */
    createMap: function() {

        var mapConfig = this.initialConfig.map || {};
        var map = new OpenLayers.Map({
            theme: mapConfig.theme || null,
            allOverlays: ("allOverlays" in mapConfig) ? mapConfig.allOverlays : true,
            controls: [
                new OpenLayers.Control.Navigation({zoomWheelEnabled: false}),
                new OpenLayers.Control.PanPanel(),
                new OpenLayers.Control.ZoomPanel()
            ],
            projection: mapConfig.projection,
            units: mapConfig.units,
            maxResolution: mapConfig.maxResolution,
            numZoomLevels: mapConfig.numZoomLevels || 20
        });

        //TODO: make this more configurable
        map.events.on({
            preaddlayer: function(evt) {
                if(evt.layer.mergeNewParams) {
                    var maxExtent = evt.layer.maxExtent;
                    evt.layer.mergeNewParams({
                        tiled: true,
                        tilesorigin: [maxExtent.left, maxExtent.bottom]
                    });
                }
            },
            scope : this
        });
        

        // place map in panel
        this.mapPanel = new GeoExt.MapPanel({
            layout: "anchor",
            border: true,
            region: "center",
            map: map,
            // TODO: update the OpenLayers.Map constructor to accept an initial center
            center: mapConfig.center && new OpenLayers.LonLat(mapConfig.center[0], mapConfig.center[1]),
            // TODO: update the OpenLayers.Map constructor to accept an initial zoom
            zoom: mapConfig.zoom,
            items: [
                {
                    xtype: "gx_zoomslider",
                    vertical: true,
                    height: 100,
                    plugins: new GeoExt.ZoomSliderTip({
                        template: "<div>Zoom Level: {zoom}</div><div>Scale: 1:{scale}"
                    })
                }
            ]
        });
        
        this.mapPanel.add(this.createMapOverlay());
        
    },
    
    /** private: method[activate]
     * Activate the application.  Call after application is configured.
     */
    activate: function() {
        
        // add any layers from config
        this.addLayers();

        // initialize tooltips
        Ext.QuickTips.init();
        
        this.fireEvent("ready");

    },
    
    /** private: method[addLayers]
     * Construct the layer store to be used with the map (referenced as 
     * :attr:`GeoExplorer.layers`).
     */
    addLayers: function() {
        var mapConfig = this.initialConfig.map;
        var mapProj = new OpenLayers.Projection(mapConfig.projection || "EPSG:4326");
        var ggProj = new OpenLayers.Projection("EPSG:4326");

        if(mapConfig && mapConfig.layers) {
            var records = [];
            
            for(var i = 0; i < mapConfig.layers.length; ++i) {
                var conf = mapConfig.layers[i];
                
                // load wms layers                
                var index = this.layerSources.findBy(function(r) {
                    return r.get("identifier") === conf.source;
                });
                
                if (index == -1) {
                    continue;
                }
                
                var storeRecord = this.layerSources.getAt(index);
                var store = storeRecord.data.store;

                var id = store.findBy(function(r) {
                    return r.get("name") === conf.name;
                });
                
                var record;
                var base;
                if (id >= 0) {
                    /**
                     * If the same layer is added twice, it will get replaced
                     * unless we give each record a unique id.  In addition, we
                     * need to clone the layer so that the map doesn't assume
                     * the layer has already been added.  Finally, we can't
                     * simply set the record layer to the cloned layer because
                     * record.set compares String(value) to determine equality.
                     * 
                     * TODO: suggest record.clone
                     */
                    Ext.data.Record.AUTO_ID++;
                    record = store.getAt(id).copy(Ext.data.Record.AUTO_ID);
                    layer = record.get("layer").clone();
                    record.data.layer = layer;

                    // TODO: allow config for layer options
                    layer.buffer = 0;
                    layer.tileSize = new OpenLayers.Size(256, 256);
                    
                    // set layer max extent from capabilities
                    //TODO SRS handling should be done in WMSCapabilitiesReader
                    layer.restrictedExtent = OpenLayers.Bounds.fromArray(record.get("llbbox")).transform(
                        ggProj, mapProj
                    );
                    
                    if (this.alignToGrid) {
                        layer.maxExtent = new OpenLayers.Bounds(-180, -90, 180, 90).transform(
                            ggProj, mapProj
                        );
                    } else {
                        layer.maxExtent = layer.restrictedExtent;
                    }


                    // set layer visibility from config
                    layer.visibility = ("visibility" in conf) ? conf.visibility : true;
                    
                    // set layer opacity from config
                    if ("opacity" in conf) {
                        layer.opacity = conf.opacity;
                    }
                    
                    // set layer format from config
                    if ("format" in conf) {
                        layer.params["FORMAT"] = conf.format;
                    }
                    
                    // set layer title from config
                    if (conf.title) {
                        /**
                         * Because the layer title data is duplicated, we have
                         * to set it in both places.  After records have been
                         * added to the store, the store handles this
                         * synchronization.
                         */
                        layer.setName(conf.title);
                        record.set("title", conf.title);
                    }

                    record.set("group", conf.group);
                    
                    // set any other layer configuration

                    records.push(record);
                }
            }
            
            // ensures that background layers are on the bottom
            records.sort(function(a, b) {
                var aGroup = a.get("group");
                var bGroup = b.get("group");
                return (aGroup == bGroup) ? 0 : 
                    (aGroup == "background" ? -1 : 1);
            });
            
            this.mapPanel.layers.add(records);

            // set map center
            if(this.mapPanel.center) {
                // zoom does not have to be defined
                this.mapPanel.map.setCenter(this.mapPanel.center, this.mapPanel.zoom);
            } else if (this.mapPanel.extent) {
                this.mapPanel.map.zoomToExtent(this.mapPanel.extent);
            } else {
                this.mapPanel.map.zoomToMaxExtent();
            }
            
        }
    },

    /**
     * private: method[initCapGrid]
     * Constructs a window with a capabilities grid.
     */
    initCapGrid: function(){

        // TODO: Might be nice to subclass some of these things into
        // into their own classes.

        var firstSource = this.layerSources.getAt(0);

        var capGridPanel = new GeoExplorer.CapabilitiesGrid({
            store: firstSource.data.store,
            mapPanel : this.mapPanel,
            layout: 'fit',
            region: 'center',
            autoScroll: true,
            alignToGrid: this.alignToGrid,
            listeners: {
                rowdblclick: function(panel, index, evt) {
                    panel.addLayers();
                }
            }
        });

        var sourceComboBox = new Ext.form.ComboBox({
            store: this.layerSources,
            valueField: "identifier",
            displayField: "name",
            triggerAction: "all",
            editable: false,
            allowBlank: false,
            forceSelection: true,
            mode: "local",
            value: firstSource.data.identifier,
            listeners: {
                select: function(combo, record, index) {
                    capGridPanel.reconfigure(record.data.store, capGridPanel.getColumnModel());
                },
                scope: this
            }
        });

        var capGridToolbar = null;

        if (this.proxy || this.layerSources.getCount() > 1) {
            capGridToolbar = [
                new Ext.Toolbar.TextItem({
                    text: "View available data from:"
                }),
                sourceComboBox
            ];
        }

        if (this.proxy) {
            capGridToolbar.push("-", new Ext.Button({
                text: "Add a New Server",
                iconCls: "icon-addserver",
                handler: function() {
                    newSourceWindow.show();
                }
            }));
        }

        var newSourceWindow = new GeoExplorer.NewSourceWindow({modal: true});
        
        newSourceWindow.on("server-added", function(url) {
            newSourceWindow.setLoading();
            
            var success = function(record) {
                // The combo box will automatically update when a new item
                // is added to the layerSources store. Now all we have to
                // do is select it. Note: There's probably a better way to do this, 
                // but there doesn't seem to be another way to get the select event
                // to fire.
                var index = this.layerSources.findBy(function(r) {
                    return r.get("identifier") === record.get("identifier");
                });
                sourceComboBox.onSelect(record, index);
                
                // Close the new source window.
                newSourceWindow.hide();
            };
            
            var failure = function() {
                newSourceWindow.setError("Error contacting server.\nPlease check the url and try again.");
            };
            
            this.addSource(url, null, success, failure, this);
        }, this);
        
        this.capGrid = new Ext.Window({
            title: "Available Layers",
            closeAction: 'hide',
            layout: 'border',
            height: 300,
            width: 600,
            modal: true,
            items: [
                capGridPanel
            ],
            tbar: capGridToolbar,
            bbar: [
                "->",
                new Ext.Button({
                    text: "Add Layers",
                    iconCls: "icon-addlayers",
                    handler: function(){
                        capGridPanel.addLayers();
                    },
                    scope : this
                }),
                new Ext.Button({
                    text: "Done",
                    handler: function() {
                        this.capGrid.hide();
                    },
                    scope: this
                })
            ],
            listeners: {
                hide: function(win){
                    capGridPanel.getSelectionModel().clearSelections();
                }
            }
        });
 
    },

    /** private: method[showCapabilitiesGrid]
     * Shows the window with a capabilities grid.
     */
    showCapabilitiesGrid: function() {
        if(!this.capGrid) {
            this.initCapGrid();
        }
        this.capGrid.show();
    },

    /** private: method[createMapOverlay]
     * Builds the :class:`Ext.Panel` containing components to be overlaid on the
     * map, setting up the special configuration for its layout and 
     * map-friendliness.
     */
    createMapOverlay: function() {
        var scaleLinePanel = new Ext.Panel({
            cls: 'olControlScaleLine overlay-element overlay-scaleline',
            border: false
        });

        scaleLinePanel.on('render', function(){
            var scaleLine = new OpenLayers.Control.ScaleLine({
                div: scaleLinePanel.body.dom
            });

            this.mapPanel.map.addControl(scaleLine);
            scaleLine.activate();
        }, this);

        var zoomStore = new GeoExt.data.ScaleStore({
            map: this.mapPanel.map
        });

        var zoomSelector = new Ext.form.ComboBox({
            emptyText: 'Zoom level',
            tpl: '<tpl for="."><div class="x-combo-list-item">1 : {[parseInt(values.scale)]}</div></tpl>',
            editable: false,
            triggerAction: 'all',
            mode: 'local',
            store: zoomStore,
            width: 110
        });

        zoomSelector.on({
            click: function(evt) {
                evt.stopEvent();
            },
            mousedown: function(evt) {
                evt.stopEvent();
            },
            select: function(combo, record, index) {
                this.mapPanel.map.zoomTo(record.data.level);
            },
            scope: this
        })

        var zoomSelectorWrapper = new Ext.Panel({
            items: [zoomSelector],
            cls: 'overlay-element overlay-scalechooser',
            border: false 
        });

        this.mapPanel.map.events.register('zoomend', this, function() {
            var scale = zoomStore.queryBy(function(record) {
                return this.mapPanel.map.getZoom() == record.data.level;
            }, this);

            if (scale.length > 0) {
                scale = scale.items[0];
                zoomSelector.setValue("1 : " + parseInt(scale.data.scale, 10));
            } else {
                if (!zoomSelector.rendered) {
                    return;
                }
                zoomSelector.clearValue();
            }
        });

        var mapOverlay = new Ext.Panel({
            // title: "Overlay",
            cls: 'map-overlay',
            items: [
                scaleLinePanel,
                zoomSelectorWrapper
            ]
        });


        mapOverlay.on("afterlayout", function(){
            scaleLinePanel.body.dom.style.position = 'relative';
            scaleLinePanel.body.dom.style.display = 'inline';

            mapOverlay.getEl().on("click", function(x){x.stopEvent();});
            mapOverlay.getEl().on("mousedown", function(x){x.stopEvent();});
        }, this);

        return mapOverlay;
    },

    /** private: method[createTools]
     * Create the toolbar configuration for the main panel.  This method can be 
     * overridden in derived explorer classes such as :class:`GeoExplorer.Full`
     * or :class:`GeoExplorer.Embed` to provide specialized controls.
     */
    createTools: function() {

        var toolGroup = "toolGroup";

        // create a navigation control
        var navAction = new GeoExt.Action({
            tooltip: "Pan Map",
            iconCls: "icon-pan",
            enableToggle: true,
            pressed: true,
            allowDepress: false,
            control: new OpenLayers.Control.Navigation({zoomWheelEnabled: false}),
            map: this.mapPanel.map,
            toggleGroup: toolGroup
        });

        // create a navigation history control
        var historyControl = new OpenLayers.Control.NavigationHistory();
        this.mapPanel.map.addControl(historyControl);

        // create actions for previous and next
        var navPreviousAction = new GeoExt.Action({
            tooltip: "Zoom to Previous Extent",
            iconCls: "icon-zoom-previous",
            disabled: true,
            control: historyControl.previous
        });
        
        var navNextAction = new GeoExt.Action({
            tooltip: "Zoom to Next Extent",
            iconCls: "icon-zoom-next",
            disabled: true,
            control: historyControl.next
        });

        // create a get feature info control
        var info = {controls: []};
        var infoButton = new Ext.Button({
            tooltip: "Get Feature Info",
            iconCls: "icon-getfeatureinfo",
            toggleGroup: toolGroup,
            enableToggle: true,
            allowDepress: false,
            toggleHandler: function(button, pressed) {
                for (var i = 0, len = info.controls.length; i < len; i++){
                    if(pressed) {
                        info.controls[i].activate();
                    } else {
                        info.controls[i].deactivate();
                    }
                }
            }
        });

        var updateInfo = function() {
            var queryableLayers = this.mapPanel.layers.queryBy(function(x){
                return x.get("queryable");
            });

            var map = this.mapPanel.map;
            var control;
            for (var i = 0, len = info.controls.length; i < len; i++){
                control = info.controls[i];
                control.deactivate();  // TODO: remove when http://trac.openlayers.org/ticket/2130 is closed
                control.destroy();
            }

            info.controls = [];
            queryableLayers.each(function(x){
                var control = new OpenLayers.Control.WMSGetFeatureInfo({
                    url: x.get("layer").url,
                    queryVisible: true,
                    layers: [x.get("layer")],
                    eventListeners: {
                        getfeatureinfo: function(evt) {
                            this.displayPopup(evt, x.get("title") || x.get("name"));
                        },
                        scope: this
                    }
                });
                map.addControl(control);
                info.controls.push(control);
                if(infoButton.pressed) {
                    control.activate();
                }
            }, this);
        };

        this.mapPanel.layers.on("update", updateInfo, this);
        this.mapPanel.layers.on("add", updateInfo, this);
        this.mapPanel.layers.on("remove", updateInfo, this);

        // create split button for measure controls
        var activeIndex = 0;
        var measureSplit = new Ext.SplitButton({
            iconCls: "icon-measure-length",
            tooltip: "Measure",
            enableToggle: true,
            toggleGroup: toolGroup, // Ext doesn't respect this, registered with ButtonToggleMgr below
            allowDepress: false, // Ext doesn't respect this, handler deals with it
            handler: function(button, event) {
                // allowDepress should deal with this first condition
                if(!button.pressed) {
                    button.toggle();
                } else {
                    button.menu.items.itemAt(activeIndex).setChecked(true);
                }
            },
            listeners: {
                toggle: function(button, pressed) {
                    // toggleGroup should handle this
                    if(!pressed) {
                        button.menu.items.each(function(i) {
                            i.setChecked(false);
                        });
                    }
                },
                render: function(button) {
                    // toggleGroup should handle this
                    Ext.ButtonToggleMgr.register(button);
                }
            },
            menu: new Ext.menu.Menu({
                items: [
                    new Ext.menu.CheckItem(
                        new GeoExt.Action({
                            text: "Length",
                            iconCls: "icon-measure-length",
                            toggleGroup: toolGroup,
                            group: toolGroup,
                            allowDepress: false,
                            map: this.mapPanel.map,
                            control: this.createMeasureControl(
                                OpenLayers.Handler.Path, "Length"
                            )
                        })
                    ),
                    new Ext.menu.CheckItem(
                        new GeoExt.Action({
                            text: "Area",
                            iconCls: "icon-measure-area",
                            toggleGroup: toolGroup,
                            group: toolGroup,
                            allowDepress: false,
                            map: this.mapPanel.map,
                            control: this.createMeasureControl(
                                OpenLayers.Handler.Polygon, "Area"
                            )
                        })
                    )
                ]
            })
        });
        measureSplit.menu.items.each(function(item, index) {
            item.on({checkchange: function(item, checked) {
                measureSplit.toggle(checked);
                if(checked) {
                    activeIndex = index;
                    measureSplit.setIconClass(item.iconCls);
                }
            }});
        });
        
        var enable3DButton = new Ext.Button({
            iconCls: "icon-3D",
            tooltip: "Switch to 3D Viewer",
            enableToggle: true,
            toggleHandler: function(button, state) {
                if (state === true) {
                    this.mapPanelContainer.getLayout().setActiveItem(1);
                    this.toolbar.disable();
                    button.enable();
                } else {
                    this.mapPanelContainer.getLayout().setActiveItem(0);
                    this.toolbar.enable();
                }
            },
            scope: this
        });
    
        var tools = [
            navAction,
            infoButton,
            measureSplit,
            "-",
            new Ext.Button({
                handler: function(){
                    this.mapPanel.map.zoomIn();
                },
                tooltip: "Zoom In",
                iconCls: "icon-zoom-in",
                scope: this
            }),
            new Ext.Button({
                tooltip: "Zoom Out",
                handler: function(){
                    this.mapPanel.map.zoomOut();
                },
                iconCls: "icon-zoom-out",
                scope: this
            }),
            navPreviousAction,
            navNextAction,
            new Ext.Button({
                tooltip: "Zoom to Visible Extent",
                iconCls: "icon-zoom-visible",
                handler: function() {
                    var extent, layer;
                    for(var i=0, len=this.mapPanel.map.layers.length; i<len; ++i) {
                        layer = this.mapPanel.map.layers[i];
                        if(layer.getVisibility()) {
                            if(extent) {
                                extent.extend(layer.restrictedExtent);
                            } else {
                                extent = layer.restrictedExtent.clone();
                            }
                        }
                    }
                    if(extent) {
                        this.mapPanel.map.zoomToExtent(extent);
                    }
                },
                scope: this
            }),
            enable3DButton
        ];

        return tools;
    },

    /** private: method[createMeasureControl]
     * :param: handlerType: the :class:`OpenLayers.Handler` for the measurement
     *     operation
     * :param: title: the string label to display alongside results
     *
     * Convenience method for creating a :class:`OpenLayers.Control.Measure` 
     * control
     */
    createMeasureControl: function(handlerType, title) {
        
        var styleMap = new OpenLayers.StyleMap({
            "default": new OpenLayers.Style(null, {
                rules: [new OpenLayers.Rule({
                    symbolizer: {
                        "Point": {
                            pointRadius: 4,
                            graphicName: "square",
                            fillColor: "white",
                            fillOpacity: 1,
                            strokeWidth: 1,
                            strokeOpacity: 1,
                            strokeColor: "#333333"
                        },
                        "Line": {
                            strokeWidth: 3,
                            strokeOpacity: 1,
                            strokeColor: "#666666",
                            strokeDashstyle: "dash"
                        },
                        "Polygon": {
                            strokeWidth: 2,
                            strokeOpacity: 1,
                            strokeColor: "#666666",
                            fillColor: "white",
                            fillOpacity: 0.3
                        }
                    }
                })]
            })
        });

        var cleanup = function() {
            if (measureToolTip) {
                measureToolTip.destroy();
            }   
        };

        var makeString = function(metricData) {
            var metric = metricData.measure;
            var metricUnit = metricData.units;
            
            measureControl.displaySystem = "english";
            
            var englishData = metricData.geometry.CLASS_NAME.indexOf("LineString") > -1 ?
            measureControl.getBestLength(metricData.geometry) :
            measureControl.getBestArea(metricData.geometry);

            var english = englishData[0];
            var englishUnit = englishData[1];
            
            measureControl.displaySystem = "metric";
            var dim = metricData.order == 2 ? 
            '<sup>2</sup>' :
            '';
            
            return metric.toFixed(2) + " " + metricUnit + dim + "<br>" + 
                english.toFixed(2) + " " + englishUnit + dim;
        };
        
        var measureToolTip; 
        var measureControl = new OpenLayers.Control.Measure(handlerType, {
            persist: true,
            handlerOptions: {layerOptions: {styleMap: styleMap}},
            eventListeners: {
                measurepartial: function(event) {
                    cleanup();
                    measureToolTip = new Ext.ToolTip({
                        html: makeString(event),
                        title: title,
                        autoHide: false,
                        closable: true,
                        draggable: false,
                        mouseOffset: [0, 0],
                        showDelay: 1,
                        listeners: {hide: cleanup}
                    });
                    if(event.measure > 0) {
                        var px = measureControl.handler.lastUp;
                        var p0 = this.mapPanel.getPosition();
                        measureToolTip.targetXY = [p0[0] + px.x, p0[1] + px.y];
                        measureToolTip.show();
                    }
                },
                measure: function(event) {
                    cleanup();                    
                    measureToolTip = new Ext.ToolTip({
                        target: Ext.getBody(),
                        html: makeString(event),
                        title: title,
                        autoHide: false,
                        closable: true,
                        draggable: false,
                        mouseOffset: [0, 0],
                        showDelay: 1,
                        listeners: {
                            hide: function() {
                                measureControl.cancel();
                                cleanup();
                            }
                        }
                    });
                },
                deactivate: cleanup,
                scope: this
            }
        });

        return measureControl;
    },

    /** private: method[displayPopup]
     * :param: evt: the event object from a 
     *     :class:`OpenLayers.Control.GetFeatureInfo` control
     * :param: title: a String to use for the title of the results section 
     *     reporting the info to the user
     */
    displayPopup: function(evt, title) {
        var popup;
        var popupKey = evt.xy.x + "." + evt.xy.y;

        if (!(popupKey in this.popupCache)) {
            var lonlat = this.mapPanel.map.getLonLatFromPixel(evt.xy);
            popup = new GeoExt.Popup({
                title: "Feature Info",
                layout: "accordion",
                lonlat: lonlat,
                map: this.mapPanel,
                width: 250,
                height: 300,
                listeners: {
                    close: (function(key) {
                        return function(panel){
                            delete this.popupCache[key];
                        };
                    })(popupKey),
                    scope: this
                }
            });
            popup.show();
            this.popupCache[popupKey] = popup;
        } else {
            popup = this.popupCache[popupKey];
        }

        // extract just the body content
        var match = evt.text.match(/<body>([\s\S]*)<\/body>/);
        if (match && !match[1].match(/^\s*$/)) {
            popup.add({
                title: title,
                layout: "fit",
                html: match[1],
                autoScroll: true,
                autoWidth: true,
                collapsible: true
            });
        }

        popup.doLayout();
    },


    /** private: method[save]
     *
     * Saves the map config and displays the URL in a window.
     */ 
    save: function(callback, scope) {
        var configStr = Ext.util.JSON.encode(this.extractConfiguration());
        var method, url;
        if (this.id) {
            method = "PUT";
            url = "maps/" + this.id;
        } else {
            method = "POST";
            url = "maps"
        }
        OpenLayers.Request[method]({
            url: url,
            data: Ext.util.JSON.encode(this.extractConfiguration()),
            callback: function(request) {
                this.handleSave(request, method);
                if (callback) {
                    callback.call(scope || this);
                }
            },
            scope: this
        });
    },
        
    /** private: method[handleSave]
     *  :arg: ``XMLHttpRequest``
     */
    handleSave: function(request, method) {
        var config = Ext.util.JSON.decode(request.responseText);
        var mapId = config.id;
        if (mapId) {
            if (method === "POST") {
                mapId = mapId.split("/").pop();
            }
            this.id = mapId;
            window.location.hash = "#maps/" + mapId;
        } else {
            throw "Trouble saving: " + request.responseText;
        }
    },
    
    /** private: method[showUrl]
     */
    showUrl: function() {
        var win = new Ext.Window({
            title: "Bookmark URL",
            layout: 'form',
            labelAlign: 'top',
            modal: true,
            bodyStyle: "padding: 5px",
            width: 300,
            items: [{
                xtype: 'textfield',
                fieldLabel: 'Permalink',
                readOnly: true,
                anchor: "100%",
                selectOnFocus: true,
                value: window.location.href
            }]
        });
        win.show();
        win.items.first().selectText();
    },
    
    /** api: method[getBookmark]
     *  :return: ``String``
     *
     *  Generate a bookmark for an unsaved map.
     */
    getBookmark: function() {
        var params = Ext.apply(
            OpenLayers.Util.getParameters(),
            {q: Ext.util.JSON.encode(this.extractConfiguration())}
        );
        
        // disregard any hash in the url, but maintain all other components
        var url = 
            document.location.href.split("?").shift() +
            "?" + Ext.urlEncode(params);
        
        return url;
    },

    /**
     * private: method[extractConfiguration]
     * :return: an :class:`Object` representing the app's current configuration.
     */ 
    extractConfiguration: function() {

        var center = this.mapPanel.map.getCenter();        
        var config = {
            sources: {},
            map: {
                center: [center.lon, center.lat],
                zoom: this.mapPanel.map.zoom,
                layers: []
            }
        };
        
        this.mapPanel.layers.each(function(layerRecord){
            var layer = layerRecord.get('layer');
            if (layer.displayInLayerSwitcher) {
                
                // Get the source of this layer.
                var index = this.layerSources.findBy(function(r) {
                    return r.get("identifier") === layerRecord.get("source_id");
                });
                var source = this.layerSources.getAt(index);
                
                if (!source) {
                    OpenLayers.Console.error("Could not find source for layer '" + layerRecord.get("name") + "'");
                    
                    // Return; error gracefully. (This is debatable.)
                    return;
                }
                // add source
                config.sources[source.get("identifier")] = source.get("url");
                
                config.map.layers.push({
                    name: layerRecord.get("name"),
                    title: layerRecord.get("title"),
                    visibility: layer.getVisibility(),
                    format: layer.params.FORMAT,
                    opacity: layer.opacity || undefined,
                    group: layerRecord.get("group"),
                    source: source.get("identifier")
                });
            }
        }, this);
        
        return config;
    },

    /** private: method[displayAppInfo]
     * Display an informational dialog about the application.
     */
    displayAppInfo: function() {
        var appInfo = new Ext.Panel({
            title: "GeoExplorer",
            html: "<iframe style='border: none; height: 100%; width: 100%' src='about.html' frameborder='0' border='0'><a target='_blank' href='about.html'>About GeoExplorer</a> </iframe>"
        });

        var about = Ext.applyIf(this.about, {
            title: '', 
            "abstract": '', 
            contact: ''
        });

        var mapInfo = new Ext.Panel({
            title: "Map Info",
            html: '<div class="gx-info-panel">' +
                  '<h2>Title</h2><p>' + about.title +
                  '</p><h2>Description</h2><p>' + about['abstract'] +
                  '</p> <h2>Contact</h2><p>' + about.contact +'</p></div>',
            height: 'auto',
            width: 'auto'
        });

        var tabs = new Ext.TabPanel({
            activeTab: 0,
            items: [mapInfo, appInfo]
        });

        var win = new Ext.Window({
            title: "About this Map",
            modal: true,
            layout: "fit",
            width: 300,
            height: 300,
            items: [tabs]
        });
        win.show();
    }
});

