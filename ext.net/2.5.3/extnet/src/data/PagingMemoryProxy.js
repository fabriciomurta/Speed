
// @source data/PagingMemory.js

Ext.data.proxy.Memory.override({
    constructor: function () {
        this.callParent(arguments);

        this.data = this.data || [];
    },

    getRecords : function () {
        return this.getReader().read(this.data || []).records;
    }
});

Ext.define("Ext.data.proxy.PagingMemory", {
    extend : "Ext.data.proxy.Memory",
    alias: "proxy.pagingmemory",
    isMemoryProxy : true,
        
    read : function (operation, callback, scope) {
        var reader = this.getReader(),
            result = reader.read(this.data || []),
            groupers = operation.groupers,
            sorters = operation.sorters, 
            filters, sorterFn, records;

        if (groupers && groupers.length) {
            // Must concat so as not to mutate passed sorters array which could be the items property of the sorters collection
            sorters = sorters ? sorters.concat(groupers) : sorters;
        }
        
        if (operation.gridfilters !== undefined) {
            var r = [];
            for (var i = 0, len = result.records.length; i < len; i++) {
                if (operation.gridfilters.call(this, result.records[i])) {
                    r.push(result.records[i]);
                }
            }
            result.records = r;
            result.totalRecords = result.records.length;
        }
        scope = scope || this;
        filters = operation.filters;
        if (filters.length > 0) {
            records = [];

            Ext.each(result.records, function (record) {
                var isMatch = true,
                    length = filters.length,
                    i;

                for (i = 0; i < length; i++) {
                    var filter = filters[i],
                        fn     = Ext.isFunction(filter) ? filter : filter.filterFn,
                        scope  = filter.scope;

                    isMatch = isMatch && (!fn || fn.call(scope, record));
                }
                if (isMatch) {
                    records.push(record);
                }
            }, this);

            result.records = records;
            result.totalRecords = result.total = records.length;
        }
        
        // sorting
        if (sorters.length > 0) {
            sorterFn = function (r1, r2) {
                var result = sorters[0].sort(r1, r2),
                    length = sorters.length,
                    i;
                
                    for (i = 1; i < length; i++) {
                        result = result || sorters[i].sort.call(this, r1, r2);
                    }                
               
                return result;
            };
    
            result.records.sort(sorterFn);
        }
        
        if (this.enablePaging !== false && operation.start !== undefined && operation.limit !== undefined && operation.isPagingStore !== true) {
            result.records = Ext.Array.slice(result.records, operation.start, operation.start + operation.limit);
            result.count = result.records.length;
        }

        Ext.apply(operation, {
            resultSet: result
        });
        
        operation.setCompleted();
        operation.setSuccessful();

        //Ext.Function.defer(function () {
            Ext.callback(callback, scope, [operation]);
        //}, 10);
    }
});