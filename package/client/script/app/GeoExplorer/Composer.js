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
    /**
     * api: method[createTools]
     * Create the toolbar configuration for the main view.
     */
    createTools: function() {
        var tools = GeoExplorer.Composer.superclass.createTools.apply(this, arguments);

        var aboutButton = new Ext.Button({
            text: "GeoExplorer",
            iconCls: "icon-geoexplorer",
            handler: this.displayAppInfo,
            scope: this
        });

        tools.unshift("-");
        tools.unshift(new Ext.Button({
            tooltip: "Publish Map",
            handler: function() {
                this.save(this.showEmbedWindow);
            },
            scope: this,
            iconCls: 'icon-export'
        }));
        tools.unshift(new Ext.Button({
            tooltip: "Save Map",
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
                {autoEl: {cls: "gx-field-label", html: "Map Size"}},
                new Ext.form.ComboBox({
                    editable: false,
                    width: 70,
                    store: new Ext.data.SimpleStore({
                        fields: ["name", "height", "width"],
                        data: [
                            ["Mini", 100, 100],
                            ["Small", 200, 300],
                            ["Large", 400, 600]
                        ]
                    }),
                    triggerAction: 'all',
                    displayField: 'name',
                    value: "Large",
                    mode: 'local',
                    listeners: {
                        select: function(combo, record, index) {
                            widthField.setValue(record.get("width"));
                            heightField.setValue(record.get("height"));
                            updateSnippet();
                        }
                    }
                }),
                {autoEl: {cls: "gx-field-label", html: "Height"}},
                heightField,
                {autoEl: {cls: "gx-field-label", html: "Width"}},
                widthField
            ]
        });

        var win = new Ext.Window({
            height: 205,
            width: 350,
            modal: true,
            title: "Export Map",
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
                        html: "Your map is ready to be published to the web! Simply copy the following HTML to embed the map in your website:"
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
