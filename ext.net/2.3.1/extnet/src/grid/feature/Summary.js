Ext.grid.feature.AbstractSummary.override({            
    generateSummaryData: function () {
        var oldData,
            result,
            store = this.view.store;

        if (store.buffered && store.pageMap && store.pageMap.hasPage(1)) {
            oldData = store.data;
            store.data = new Ext.util.MixedCollection(false, Ext.data.Store.recordIdFn);
            store.data.addAll(store.pageMap.getPage(1));
        }

        result = this.callOverridden(arguments);

        if (store.buffered && oldData) {
            store.data = oldData;
        }

        return result;
    }
});