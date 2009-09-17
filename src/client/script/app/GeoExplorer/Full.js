/**
 * Copyright (c) 2009 OpenGeo
 */

/*
 * @include GeoExplorer/Wizard.js
 */ 

/**
 * api: (define)
 * module = GeoExplorer
 * class = GeoExplorer.Full(config)
 * extends = GeoExplorer
 */

/** api: constructor
 *  .. class:: GeoExplorer.Full(config)
 *
 *      Create a GeoExplorer application intended for full-screen display.
 */
GeoExplorer.Full = Ext.extend(GeoExplorer, {
    /**
     * api: method[createTools]
     * Create the toolbar configuration for the main view.
     */
    createTools: function() {
        var tools = 
            GeoExplorer.Full.superclass.createTools.apply(this, arguments);

        var aboutButton = new Ext.Button({
            text: "GeoExplorer",
            iconCls: "icon-geoexplorer",
            handler: this.displayAppInfo,
            scope: this
        });

        tools.unshift("-");
        tools.unshift(new Ext.Button({
            tooltip: "Bookmark",
            handler: this.bookmark,
            scope: this,
            iconCls: "icon-bookmark"
        }));
        tools.unshift(new Ext.Button({
            tooltip: "Publish Map",
            handler: this.showEmbedWizard,
            scope: this,
            iconCls: 'icon-export'
        }));
        tools.unshift("-");
        tools.unshift(aboutButton);
        return tools;
    },

    /** private: method[showEmbedWizard]
     *
     * Builds several panels and combines them into a 
     * :class:``GeoExplorer.Wizard`` to guide the user through customizing and 
     * exporting a map for display embedded in another website.
     *
     * ..seealso:: :method:`GeoExplorer.Full.makeLayerWizardPane`, :method:`GeoExplorer.Full.makeFinalWizardPane`
     */
    showEmbedWizard: function() {
        var config = this.extractConfiguration();

        var layerSelection = this.makeLayerWizardPane(config);
        var finalize = this.makeFinalWizardPane(config);
        var wizard = new GeoExplorer.Wizard({
            height: 300,
            width: 400,
            resizable: false,
            modal: true,
            title: "Export Map",
            pages: [{
                title: 'Layers',
                panel: layerSelection
            },{
                title: 'Done!', 
                panel: finalize
            }]
        });
        wizard.show();
    },

    /** private: method[makeFinalWizardPane]
     *
     * Create the 'okay, done!' page of the export wizard, providing the HTML 
     * snippet to use for embedding the map, etc. 
     */
    makeFinalWizardPane: function(config) {
        var description = new Ext.Panel({
            cls: 'gx-wizard-description',
            html: '<p> Your map is ready to be published to the web! </p>' +
            '<p> Simply copy the following HTML to embed the map in your website: </p>',
            border: false
        });

        var snippetArea = new Ext.form.TextArea({
            height: '100',
            selectOnFocus: true,
            enableKeyEvents: true,
            listeners: {
                keypress: function(area, evt) {
                    evt.stopEvent();
                }
            }
        });
 
        var heightField = new Ext.form.NumberField({width: 50, value: 400});
        var widthField = new Ext.form.NumberField({width: 50, value: 600});

        var updateSnippet = function() {
            var query = Ext.urlEncode({q: Ext.util.JSON.encode(config)}); 

            // TODO: configurablize!!!1!!!!!111!!!!!!
            var pathname = window.location.pathname.replace(/\/[^\/]*$/, '/embed.html'); 
            var url = 
                window.location.protocol + "//" +
                window.location.host +
                pathname + "?" + query;

            snippetArea.setValue('<iframe height="' + heightField.getValue() +
                ' " width="' + widthField.getValue() + '" src="' + url +
                '"> </iframe>');
        };

        heightField.on("change", updateSnippet);
        widthField.on("change", updateSnippet);

        var snippet = new Ext.Panel({
            border: false,
            layout: 'fit',
            cls: 'gx-snippet-area',
            items: [snippetArea]
        });

        var adjustments = new Ext.Panel({
            layout: "column",
            items: [
                new Ext.Panel({
                border: false, 
                width: 90,
                items: [
                    new Ext.form.ComboBox({
                    editable: false,
                    width: 70,
                    store: new Ext.data.SimpleStore({
                        fields: ["name", "height", "width"],
                        data: [
                            ["Mini", 100, 100],
                            ["Small", 200, 300],
                            ["Large", 400, 600],
                            ["Premium", 600, 800]
                        ]}),
                    triggerAction: 'all',
                    displayField: 'name',
                    value: "Large",
                    mode: 'local',
                    listeners: {
                        'select': function(combo, record, index) {
                                widthField.setValue(record.get("width"));
                                heightField.setValue(record.get("height"));
                                updateSnippet();
                            }
                        }
                    })
                ]}),
                {cls: 'gx-field-label', html: "Height", border: false},
                heightField,
                {cls: 'gx-field-label', html: "Width", border: false},
                widthField
            ],
            border: false
        });

        return new Ext.Panel({
            cls: 'gx-wizard-pane',
            border: false,
            items: [
                description, 
                snippet, 
                {cls: 'gx-field-label', html: "Map Size", border: false},
                adjustments],
            listeners: {
                show: updateSnippet
            }
        });
    },

    /** api: method[makeLayerWizardPane]
     * Create the layer selection page for the export wizard.
     */
    makeLayerWizardPane: function (config) {
        var datalayers = [];
        var basemaps = [];

        for (var i=config.map.layers.length-1; i>=0; --i) {
            if (config.map.layers[i].group === "background") {
                basemaps.push(config.map.layers[i]);
            } else {
                datalayers.push(config.map.layers[i]);
            }
        }

        var datalayerstore = new Ext.data.JsonStore({
            fields: ['name', {name: 'visibility', type: 'bool'}],
            data: datalayers
        });

        var basemapstore = new Ext.data.JsonStore({
            fields: ['name', {name: 'visibility', type: 'bool'}],
            data: basemaps
        });

        var titleRenderer = function(value) {
            var record = layerStore.getAt(layerStore.find("name", value));
            return record.get('title') || value;
        };


        var cbRenderer = function(value) {
            return '<input type="checkbox"' +
                (value ? ' checked="checked"' : '') +
                '></input>';
        };

        var datagrid = new Ext.grid.GridPanel({
            store: datalayerstore,
            region: 'center',
            autoScroll: true,
            width: "50%",
            autoExpandColumn: "layer",
            enableHdMenu: false,
            title: "Data Layers",
            columns: [
                {
                    header: '<span class="gx-layer-visibility">&nbsp;</span>',
                    id: 'visibility',
                    dataIndex: 'visibility',
                    width: 28,
                    resizable: false,
                    renderer: cbRenderer
                },{
                    header: 'Name',
                    id: 'layer',
                    dataIndex: 'name',
                    resizable: false,
                    renderer: titleRenderer
                }
            ],
            listeners: {
                rowclick: function(grid, index, evt) {
                    var record = grid.getStore().getAt(index);
                    record.set("visibility", !record.get("visibility"));
                }
            }
        });

        var radioRenderer = function(value) {
            return '<input type="radio"' +
                (value ? ' checked="checked"' : '') +
                '></input>';
        };

        var layerStore = this.mapPanel.layers;

        var basegrid = new Ext.grid.GridPanel({
            store: basemapstore,
            region: 'east',
            width: "50%",
            autoScroll: true,
            autoExpandColumn: "layer",
            enableHdMenu: false,
            title: "Base Layers",
            columns: [
                {
                    header: '<span class="gx-layer-visibility">&nbsp;</span>',
                    id: 'visibility',
                    dataIndex: 'visibility',
                    width: 28,
                    resizable: false,
                    renderer: radioRenderer
                }, {
                    header: 'Name',
                    id: 'layer',
                    dataIndex: 'name',
                    resizable: false,
                    renderer: titleRenderer
                }
            ],
            listeners: {
                rowclick: function(grid, index, evt) {
                    var record = grid.getStore().getAt(index);
                    grid.getStore().each(function(record) {
                        record.set("visibility", false);
                    });
                    record.set("visibility", true);
                }
            }
        });

        return new Ext.Panel({
            layout: 'border',
            border: false,
            cls: 'gx-wizard-pane',
            items: [
                {
                    region: 'north',
                    cls: "gx-wizard-description",
                    border: false,
                    html:'<p>Set initial layer visibility for published map:</p>'
                },
                datagrid, 
                basegrid
            ],
            listeners: {
                hide: function() {
                    for (var i = 0, len = config.map.layers.length;
                        i < len; 
                        i++) {
                        var layer = config.map.layers[i];
                        
                        var record = 
                            datalayerstore.getAt(datalayerstore.find("name", layer.name));

                        if (!record) {
                            record = 
                                basemapstore.getAt(basemapstore.find("name", layer.name));
                        }

                        if (record) layer.visibility = record.get("visibility");
                    }
                }
            }
        });
    }
});
