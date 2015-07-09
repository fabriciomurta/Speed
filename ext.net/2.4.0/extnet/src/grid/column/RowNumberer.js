Ext.grid.RowNumberer.override({
    initRenderData : function () {
        var me = this;          
        me.grid = me.up('tablepanel');   
        /*me.grid.store.on("bulkremove", function () {
            this.grid.view.refresh();
        }, me, {buffer:10});*/

        me.grid.store.on("bulkremove", function () {
            var store = this.grid.store,
                i,
                len;

            for (i = 0, len = store.getCount(); i < len; i++) { 
                store.data.items[i].index = i;                
            }

            if (store.snapshot) {
                for (var i = 0, len = store.snapshot.length; i < len; i++) { 
                    store.snapshot.items[i].index = i;                
                }
            }

            store.fireEvent('refresh', store);
        }, me);

        return me.callParent(arguments);
    },

    renderer: function(value, metaData, record, rowIdx, colIdx, store) {
        var rowspan = this.rowspan;
        if (rowspan) {
            metaData.tdAttr = 'rowspan="' + rowspan + '"';
        }

        metaData.tdCls = Ext.baseCSSPrefix + 'grid-cell-special';
        return store.indexOfTotal ? (store.indexOfTotal(record) + 1) : (rowIdx + 1); 
    }
});