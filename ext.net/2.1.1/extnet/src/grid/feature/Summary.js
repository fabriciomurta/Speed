Ext.grid.feature.Summary.override({            
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

Ext.grid.feature.GroupingSummary.override({
    aggregate: function (fn, scope, grouped, args) {
        args = args || [];
        if (grouped && this.isGrouped()) {
            var groups = this._groupingSummaryPlugin.summaryGroups,
                i,
                len = groups.length,
                out = {},
                group,
                records = this.pageMap.getPage(1),
                recLength = records.length,
                record,
                groupStr,
                pointers = {};

            for (i = 0; i < len; ++i) {                        
                group = groups[i];
                pointers[group.name] = {
                    name: group.name,
                    children: []
                };
            }

            for (i = 0; i < recLength; i++) {
                record = records[i];
                groupStr = this.getGroupString(record);
                group = pointers[groupStr];

                if (group) {
                    group.children.push(record);
                }                        
            }

            for (i = 0; i < len; ++i) {
                group = groups[i];
                out[group.name] = fn.apply(scope || this, [pointers[group.name].children].concat(args));
            }
            return out;
        } else {
            return fn.apply(scope || this, [this.data.items].concat(args));
        }
    },

    generateSummaryData: function () {
        var oldData,
            oldAggregate,
            result,
            store = this.view.store;

        if (store.buffered && store.pageMap && store.pageMap.hasPage(1)) {
            if (store.isGrouped()) {
                oldAggregate = store.aggregate;
                store.aggregate = this.aggregate;
                store._groupingSummaryPlugin = this;
            } else {                    
                oldData = store.data;
                store.data = new Ext.util.MixedCollection(false, Ext.data.Store.recordIdFn);
                store.data.addAll(store.pageMap.getPage(1));
            }
        }

        result = this.callOverridden(arguments);

        if (store.buffered && oldData) {
            store.data = oldData;
        }

        if (store.buffered && oldAggregate) {
            store.aggregate = oldAggregate;
            delete store._groupingSummaryPlugin;
        }

        return result;
    }
});