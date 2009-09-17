/**
 * Copyright (c) 2009 OpenGeo
 */

Ext.namespace("GeoExplorer");

/**
 * api: (define)
 * module = GeoExplorer
 * class = Wizard(config)
 * extends = Ext.Window
 */

/** api: constructor
 *  .. class:: GeoExplorer.Wizard(config)
 *     Create a wizard for guiding the user through a sequence of operations.
 */

/** api: config[pages]
 * An array of :class:`Object`\ s defining the steps of the wizard.  Each object
 * should define:
 *
 * title
 *     the user-visible title of this step in the wizard
 * panel
 *     the :class:`Ext.Panel` instance to display for this wizard step.
 */

GeoExplorer.Wizard = function(config) { 
    Ext.applyIf(config, {
        layout: 'card',
        activeItem: 0,
        tbar: [],
        bbar: [],
        items: []
    });

    for (var i = 0, len = config.pages.length; i < len; i++) {
        if (i !== 0) config.tbar.push({text: '&rarr;', disabled: true});

        config.pages[i].panel.wizardNavButton = new Ext.Button({
            text: config.pages[i].title, 
            disabled: i > 1,
            handler: function(x) {
                return function() { this.layout.setActiveItem(x); this.doLayout(); };
            }(config.items.length),
            scope: this
        });

        config.pages[i].panel.on("show", function(panel){
            panel.wizardNavButton.addClass("gx-wizard-active");
            this.updateNavButtons();
        }, this);
        config.pages[i].panel.on("hide", function() {
            this.wizardNavButton.removeClass("gx-wizard-active");
        });

        config.tbar.push(config.pages[i].panel.wizardNavButton);
        config.items.push(config.pages[i].panel);
    }

    config.bbar.push("->");

    this.backButton = new Ext.Button({
        text: 'Back',
        handler: function() {
            this.previousWizardPanel();
        }, 
        scope: this,
        disabled: true
    });

    this.nextButton = new Ext.Button({
        text: 'Next',
        handler: function(button) {
            this.nextWizardPanel();
        }, 
        scope: this,
        disabled: (config.items.length <= 1)
    })

    config.bbar.push(this.backButton);
    config.bbar.push(this.nextButton);

    GeoExplorer.Wizard.superclass.constructor.call(this, config);
};

Ext.extend(GeoExplorer.Wizard, Ext.Window, {

    /** private: property[backButton]
     * A reference to the 'back' button on the toolbar
     */
    backButton: null,

    /** private: property[nextButton]
     * A reference to the 'next' button on the toolbar
     */
    nextButton: null,

    /** api: method[previousWizardPanel] 
     * Activate the previous panel in the wizard
     */
    previousWizardPanel: function() {
        var activeIndex = this.items.findIndexBy(function(x){
            return x === this.layout.activeItem;
        }, this);

        if (activeIndex > 0) {
            this.layout.setActiveItem(activeIndex-1);
            this.doLayout();
            this.updateNavButtons();
        }
    },

    /** api: method[nextWizardPanel] 
     * Activate the next panel in the wizard
     */
    nextWizardPanel: function() {
        var activeIndex = this.items.findIndexBy(function(x){
            return x === this.layout.activeItem;
        }, this);

        if (activeIndex +1 < this.items.length) {
            this.layout.setActiveItem(activeIndex+1);
            this.doLayout();
            this.updateNavButtons();
        }
    },

    /** private: method[updateNavButtons] 
     * Enable or disable navigation buttons based on the current active page.
     */
    updateNavButtons: function() {
        var activeIndex = this.items.findIndexBy(function(x){
            return x === this.layout.activeItem;
        }, this);

        if (activeIndex > 0) {
            this.backButton.enable();
        } else {
            this.backButton.disable();
        }

        if (activeIndex < this.items.length - 1) {
            this.nextButton.enable();
        } else {
            this.nextButton.disable();
        }

        var nextPanel = this.items.itemAt(activeIndex + 1);
        if (nextPanel && nextPanel.wizardNavButton) nextPanel.wizardNavButton.enable();
    }
});

