/********
* @author: Ext.NET, Inc. http://www.ext.net/
* @date: 2013-05-17
* @copyright: Copyright (c) 2007-2012, Ext.NET, Inc. All rights reserved.
* @license: The MIT License, see http://www.opensource.org/licenses/mit-license.php
********/

Ext.define("Ext.ux.plugins.TabFx", {
    extend: "Ext.AbstractPlugin",
    alias: "plugin.tabfx",
    name: "frame",
            
    constructor: function (config) {
        Ext.apply(this, config);
    },
 
    init: function (tb) {
        var plugin = this;
 
        if (tb.tabBar) { // it means that a plugin is used for a TabPanel, overwise a TabBar or a TabStrip
            // to apply an fx function for the initial activation
            if (tb.activeTab) {
                tb.activeTab.on("activate", function () {
                    if (!plugin.disabled) {
                        plugin.doFx(this.tab);
                    }
                }, tb.activeTab, { single: true })
            }
 
            tb = tb.tabBar;
        }
 
        tb.on("change", function (tb, newTab) { 
            if (!this.disabled) {
                this.doFx(newTab);
            }
        }, plugin);
    },
 
    doFx: function (tab) {
        var plugin = this,
            tabEl = tab.getEl();
 
        tabEl[plugin.name].apply(tabEl, Ext.isArray(plugin.args) ? plugin.args : []);
    }
});

Ext.net.ResourceMgr.notifyScriptLoaded();
