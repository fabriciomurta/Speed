// @source core/tip/ToolTip.js

Ext.ToolTip.override({
    // #671
    setTarget: function (target) {
        this.target = Ext.net.getEl(this.target);
        target = Ext.net.getEl(target);
        this.callParent([target]);
    }
});