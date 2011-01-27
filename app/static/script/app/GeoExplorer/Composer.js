/**
 * Copyright (c) 2009-2010 The Open Planning Project
 *
 * @requires GeoExplorer.js
 */

/**
 * api: (define)
 * module = GeoExplorer
 * class = GeoExplorer.Composer(config)
 * extends = GeoExplorer
 */

/** api: constructor
 *  .. class:: GeoExplorer.Composer(config)
 *
 *      Create a GeoExplorer application intended for full-screen display.
 */
GeoExplorer.Composer = Ext.extend(GeoExplorer, {

    // Begin i18n.
    publishMapText: "Publish Map",
    saveMapText: "Save Map",
    mapSizeText: "Map Size",
    miniText: "Mini",
    smallText: "Small",
    largeText: "Large",
    heightText: "Height",
    widthText: "Width",
    exportMapText: "Export Map",
    embedText: "Your map is ready to be published to the web! Simply copy the following HTML to embed the map in your website:",
    // End i18n.

    constructor: function(config) {
        
        config.tools = [
            {
                ptype: "gxp_layertree",
                outputConfig: {
                    id: "layertree",
                    tbar: []
                },
                outputTarget: "tree"
            },
            {
                ptype: "gxp_addlayers",
                actionTarget: "layertree.tbar"
            }, {
                ptype: "gxp_removelayer",
                actionTarget: ["layertree.tbar", "layertree.contextMenu"]
            }, {
                ptype: "gxp_layerproperties",
                actionTarget: ["layertree.tbar", "layertree.contextMenu"]
            }, {
                ptype: "gxp_zoomtolayerextent",
                actionTarget: {target: "layertree.contextMenu", index: 0}
            }, {
                ptype: "gxp_navigation", toggleGroup: this.toggleGroup,
                actionTarget: {target: "paneltbar", index: 6}
            }, {
                ptype: "gxp_wmsgetfeatureinfo", toggleGroup: this.toggleGroup,
                actionTarget: {target: "paneltbar", index: 7}
            }, {
                ptype: "gxp_measure", toggleGroup: this.toggleGroup,
                actionTarget: {target: "paneltbar", index: 8}
            }, {
                ptype: "gxp_zoom",
                actionTarget: {target: "paneltbar", index: 9}
            }, {
                ptype: "gxp_navigationhistory",
                actionTarget: {target: "paneltbar", index: 11}
            }, {
                ptype: "gxp_zoomtoextent",
                actionTarget: {target: "paneltbar", index: 13}
            }
        ];
        
        GeoExplorer.Composer.superclass.constructor.apply(this, arguments);
    }, 
    

    /**
     * api: method[createTools]
     * Create the toolbar configuration for the main view.
     */
    createTools: function() {
        var tools = GeoExplorer.Composer.superclass.createTools.apply(this, arguments);

        var aboutButton = new Ext.Button({
            text: this.appInfoText,
            iconCls: "icon-geoexplorer",
            handler: this.displayAppInfo,
            scope: this
        });

        tools.unshift("-");
        tools.unshift(new Ext.Button({
            tooltip: this.publishMapText,
            handler: function() {
                this.save(this.showEmbedWindow);
            },
            scope: this,
            iconCls: 'icon-export'
        }));
        tools.unshift(new Ext.Button({
            tooltip: this.saveMapText,
            handler: function() {
                this.save(this.showUrl);
            },
            scope: this,
            iconCls: "icon-save"
        }));
        tools.unshift("-");
        tools.unshift(aboutButton);
        return tools;
    },

    /** private: method[showEmbedWindow]
     */
    showEmbedWindow: function() {

        // TODO: Get rid of viewer.html
        var obj = OpenLayers.Util.createUrlObject("viewer.html");
        var port = (obj.port === "80") ? "" : ":" + obj.port;
        var url = obj.protocol + "//" + obj.host + port + obj.pathname + "#maps/" + this.id;

        var snippetArea = new Ext.form.TextArea({
            height: 70,
            selectOnFocus: true,
            readOnly: true
        });
 
        var updateSnippet = function() {
            snippetArea.setValue(
                '<iframe height="' + heightField.getValue() +
                ' " width="' + widthField.getValue() + '" src="' + url + '"> </iframe>'
            );
        };

        var heightField = new Ext.form.NumberField({
            width: 50,
            value: 400,
            listeners: {change: updateSnippet}
        });
        var widthField = new Ext.form.NumberField({
            width: 50,
            value: 600,
            listeners: {change: updateSnippet}
        });        

        var adjustments = new Ext.Container({
            layout: "column",
            defaults: {
                border: false,
                xtype: "box"
            },
            items: [
                {autoEl: {cls: "gx-field-label", html: this.mapSizeText}},
                new Ext.form.ComboBox({
                    editable: false,
                    width: 70,
                    store: new Ext.data.SimpleStore({
                        fields: ["name", "height", "width"],
                        data: [
                            [this.miniText, 100, 100],
                            [this.smallText, 200, 300],
                            [this.largeText, 400, 600]
                        ]
                    }),
                    triggerAction: 'all',
                    displayField: 'name',
                    value: this.largeText,
                    mode: 'local',
                    listeners: {
                        select: function(combo, record, index) {
                            widthField.setValue(record.get("width"));
                            heightField.setValue(record.get("height"));
                            updateSnippet();
                        }
                    }
                }),
                {autoEl: {cls: "gx-field-label", html: this.heightText}},
                heightField,
                {autoEl: {cls: "gx-field-label", html: this.widthText}},
                widthField
            ]
        });

        var win = new Ext.Window({
            height: 205,
            width: 350,
            modal: true,
            title: this.exportMapText,
            layout: "fit",
            items: [{
                xtype: "container",
                border: false,
                defaults: {
                    border: false,
                    cls: "gx-export-section",
                    xtype: "container",
                    layout: "fit"
                },
                items: [{
                    xtype: "box",
                    autoEl: {
                        tag: "p",
                        html: this.embedText
                    }
                }, {
                    items: [snippetArea]
                }, {
                    items: [adjustments]
                }]
            }],
            listeners: {afterrender: updateSnippet}
        });
        win.show();
    }

});
