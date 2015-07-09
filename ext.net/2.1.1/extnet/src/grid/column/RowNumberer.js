Ext.grid.RowNumberer.override({
    initRenderData : function () {
        var me = this;          
        me.grid = me.up('tablepanel');   
        me.grid.store.on("bulkremove", function () {
            this.grid.view.refresh();
        }, me, {buffer:10});

        return me.callParent(arguments);
    }
});