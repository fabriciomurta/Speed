Ext.grid.RowNumberer.override({
    initRenderData : function () {
        var me = this;          
        me.grid = me.up('tablepanel');   
        
        me.grid.store.on("bulkremove", this.updateRecordsIndexes, me);

        return me.callParent(arguments);
    },

    updateRecordsIndexes: function () {
        var store = this.grid.store,
            i,
            records = store.getAllRange ? store.getAllRange() : store.getRange(), 
            len;

        for (i = 0, len = records.length; i < len; i++) { 
            records[i].index = i;
        }

        if (store.snapshot) {
            for (i = 0, len = store.snapshot.length; i < len; i++) { 
                store.snapshot.items[i].index = i;                
            }
        }

        store.fireEvent('refresh', store);
    },

    renderer: function(value, metaData, record, rowIdx, colIdx, store) {
        var rowspan = this.rowspan;
        if (rowspan) {
            metaData.tdAttr = 'rowspan="' + rowspan + '"';
        }

        metaData.tdCls = Ext.baseCSSPrefix + 'grid-cell-special';

        if (store.isPagingStore && store.proxy instanceof Ext.data.proxy.Memory) {
            return (store.allData || store.data).indexOf(record) + 1;
        }

        return store.indexOfTotal ? (store.indexOfTotal(record) + 1) : (rowIdx + 1); 
    }
});