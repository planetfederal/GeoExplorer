/**
 * Copyright (c) 2009-2010 The Open Planning Project
 *
 * @requires GeoExplorer.js
 */

/** api: (define)
 *  module = GeoExplorer
 *  class = Embed
 *  base_link = GeoExplorer
 */
Ext.namespace("GeoExplorer");

/** api: constructor
 *  ..class:: GeoExplorer.Viewer(config)
 *
 *  Create a GeoExplorer application suitable for embedding in larger pages.
 */
GeoExplorer.Viewer = Ext.extend(GeoExplorer, {
    
    applyConfig: function(config) {
        var allTools = config.viewerTools || this.viewerTools;
        var tools = [];
        var toolConfig;
        // we need to start counting at 2 since there is the Layer Switcher and a 
        // split button already
        var counter = 2;
        for (var i=0, len=allTools.length; i<len; i++) {
            var tool = allTools[i];
            if (tool.checked === true) {
                var properties = ['checked', 'iconCls', 'id', 'leaf', 'loader', 'text'];
                for (var key in properties) {
                    delete tool[properties[key]];
                }
                toolConfig = Ext.applyIf({
                    actionTarget: {target: "paneltbar", index: counter}
                }, tool);
                if (tool.numberOfButtons !== undefined) {
                    counter += tool.numberOfButtons;
                } else {
                    counter++;
                }
                // TODO: Remove this hack for getting the apiKey into the viewer
                if (tool.ptype === "gxp_googleearth") {
                    // look for apiKey and apiKeys in saved composer config
                    var jj = config.tools ? config.tools.length : 0;
                    var composerConfig;
                    for (var j=0; j<jj; ++j) {
                        composerConfig = config.tools[j];
                        if (composerConfig.ptype === tool.ptype) {
                            toolConfig.apiKey = composerConfig.apiKey;
                            toolConfig.apiKeys = composerConfig.apiKeys;
                            break;
                        }
                    }
                }
                tools.push(toolConfig);
            }
        }
        config.tools = tools;
        GeoExplorer.Viewer.superclass.applyConfig.call(this, config);
    },

    /** private: method[initPortal]
     * Create the various parts that compose the layout.
     */
    initPortal: function() {

        this.toolbar = new Ext.Toolbar({
            disabled: true,
            id: "paneltbar",
            items: this.createTools()
        });
        this.on("ready", function() {this.toolbar.enable();}, this);

        this.mapPanelContainer = new Ext.Panel({
            layout: "card",
            region: "center",
            defaults: {
                border: false
            },
            items: [
                this.mapPanel,
                new gxp.GoogleEarthPanel({
                    mapPanel: this.mapPanel,
                    listeners: {
                        beforeadd: function(record) {
                            return record.get("group") !== "background";
                        }
                    }
                })
            ],
            activeItem: 0
        });

        this.portalItems = [{
            region: "center",
            layout: "border",
            tbar: this.toolbar,
            items: [
                this.mapPanelContainer
            ]
        }];
        
        GeoExplorer.superclass.initPortal.apply(this, arguments);        

    },

    /**
     * api: method[createTools]
     * Create the various parts that compose the layout.
     */
    createTools: function() {
        var tools = GeoExplorer.Viewer.superclass.createTools.apply(this, arguments);

        var layerChooser = new Ext.Button({
            tooltip: 'Layer Switcher',
            iconCls: 'icon-layer-switcher',
            menu: new gxp.menu.LayerMenu({
                layers: this.mapPanel.layers
            })
        });

        tools.unshift("-");
        tools.unshift(layerChooser);

        var aboutButton = new Ext.Button({
            tooltip: this.aboutText,
            iconCls: "icon-about",
            handler: this.displayAppInfo,
            scope: this
        });

        tools.push("->");
        tools.push(aboutButton);

        return tools;
    }
});
