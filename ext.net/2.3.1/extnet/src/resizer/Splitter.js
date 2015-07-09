Ext.resizer.Splitter.override({
    getCollapseTarget: function () {
        var me = this;

        if (me.collapseTarget != "prev" && me.collapseTarget != "next" && Ext.isString(me.collapseTarget)) {
           var cmp = Ext.net.ResourceMgr.getCmp(me.collapseTarget);
           if (cmp) {
               me.collapseTarget = cmp;
           }
        }

        return me.collapseTarget.isComponent ? me.collapseTarget : me.collapseTarget == 'prev' ? me.previousSibling() : me.nextSibling();
    }
});