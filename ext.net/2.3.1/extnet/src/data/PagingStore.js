// @source data/PagingStore.js
/*
 * PagingStore for Ext 4.x
 */

Ext.define("Ext.data.PagingStore", {    
    extend : "Ext.data.Store",
    alias  : "store.paging",

    isPagingStore : true,
        
    destroyStore : function () {                
        this.callParent(arguments);
        this.data = this.allData = this.snapshot = null;
    },
    
    doSort : function (sorterFn) {
        var me = this,
            count,
            range,
            ln,
            i;
        if (me.remoteSort) {
            if (me.buffered) {
                me.data.clear();
                me.loadPage(1);
            } else {
                //the load function will pick up the new sorters and request the sorted data from the proxy
                me.load();
            }
        } else {
            if (me.allData) {
                me.data = me.allData;
                delete me.allData;
            }
            
            if (me.snapshot) {
                me.snapshot.sortBy(sorterFn);
            }
            
            me.data.sortBy(sorterFn);
            me.applyPaging();
            
            if (!me.buffered) {
                range = me.getRange();
                ln = range.length;
                for (i = 0; i < ln; i++) {
                    range[i].index = i;
                }
            }
            
            me.fireEvent('datachanged', me);
            me.fireEvent('refresh', me);
        }
    },
    
    insert : function (index, records) {
        var me = this,
            sync = false,
            i,
            record,
            len,
            defaults = me.modelDefaults,
            out;

        if (!Ext.isIterable(records)) {
            out = records = [records];
        } else {
            out = [];
        }
        len = records.length;
        if (len) {
            for (i = 0; i < len; i++) {
                record = records[i];
                if (!record.isModel) {
                    record = me.createModel(record);
                }
                out[i] = record;
                if (defaults) {
                    record.set(defaults);
                }    
                
                record.join(me);           
            
                sync = sync || record.phantom === true;
            }

            // Add records to data in one shot
            me.data.insert(index, out);

            if (me.snapshot) {
                me.snapshot.addAll(out);
            }
        
            if (me.allData) {
                me.allData.addAll(out);
            }
        
            me.totalCount += out.length;

            if (me.requireSort) {
                // suspend events so the usual data changed events don't get fired.
                me.suspendEvents();
                me.sort();
                me.resumeEvents();
            }

            if (me.isGrouped()) {
                me.updateGroupsOnAdd(out);
            }

            me.fireEvent('add', me, out, index);
            me.fireEvent('datachanged', me);
            if (me.autoSync && sync && !me.autoSyncSuspended) {
                me.sync();
            }
        }

        return out;
    },
    
    remove : function (records, /* private */ isMove, silent) {
        /*
         * Pass the isMove parameter if we know we're going to be re-inserting this record
         */
        isMove = isMove === true;
        var me = this,
            sync = false,
            snapshot = me.snapshot,
            data = me.data,
            i = 0,
            length,
            info = [],
            allRecords = [],
            indexes = [],
            item,
            isNotPhantom,
            index,
            record,
            removeRange,
            removeCount,
            fireRemoveEvent = !silent && me.hasListeners.remove;

        // Remove a single record
        if (records.isModel) {
            records = [records];
            length = 1;
        }

        // Or remove(myRecord)
        else if (Ext.isIterable(records)) {
            length = records.length;
        }

        // Allow remove({start:100: end: 110})
        // Private API used by removeAt to remove multiple, contiguous records
        else if (typeof records === 'object') {
            removeRange = true;
            i = records.start;
            length = records.end + 1;
            removeCount = length - i;
        }

        if (!removeRange) {
            for (i = 0; i < length; ++i) {            
                record = records[i];

                // Encountered a record index
                if (typeof record == 'number') {
                    index = record;
                    record = data.getAt(index);
                }
                // Removing a record instance
                else {
                    index = me.indexOf(record);
                }

                // Check record. If number passed, it may not exist.
                if (record && index > -1) {
                    info.push({
                        record: record,
                        index: index
                    });
                }

                // record guaranteed to be a record now
                if (snapshot) {
                    snapshot.remove(record);
                }

                if (me.allData) {
                    me.allData.remove(record);
                }

                me.totalCount--;
            }

            info = Ext.Array.sort(info, function (o1, o2) {
                var index1 = o1.index,
                    index2 = o2.index;
                
                return index1 === o2.index2 ? 0 : (index1 < index2 ? -1 : 1);
            });

            // The loop below loops through the info array if not removing contiguous range
            i = 0;
            length = info.length;
        }

        // we need to maintain a set of indexes since we're not guaranteed to
        // be removing the records in order
        // Start value of i is calculated!
        for (; i < length; i++) {
            if (removeRange) {
                record = data.getAt(i);
                index = i;
            } else {
                item = info[i];
                record = item.record;
                index = item.index;
            }
            
            allRecords.push(record);
            indexes.push(index);
            
            isNotPhantom = record.phantom !== true;
            // don't push phantom records onto removed
            if (!isMove && isNotPhantom) {

                // Store the index the record was removed from so that rejectChanges can re-insert at the correct place.
                // The record's index property won't do, as that is the index in the overall dataset when Store is buffered.
                record.removedFrom = index;
                me.removed.push(record);
            }

            record.unjoin(me);
            // Remove using the index, but subtract any intervening removed records which would cause the data
            // array to shuffle up.
            index -= i;
            sync = sync || isNotPhantom;

            // If we have not been asked to remove a range we must remove individual records
            // and fire the individual remove event..
            if (!removeRange) {
                data.removeAt(index);
                // Only fire individual remove events if not silent, and there are listeners.
                if (fireRemoveEvent) {
                    me.fireEvent('remove', me, record, index, !!isMove);
                }
            }
        }

        // If there was no listener for the single remove event, remove all records
        // from collection in one call
        if (removeRange) {
            data.removeRange(records.start, removeCount);
        }

        if (!silent) {
            me.fireEvent('bulkremove', me, allRecords, indexes, !!isMove);
            me.fireEvent('datachanged', me);
        }

        if (!isMove && me.autoSync && sync && !me.autoSyncSuspended) {
            me.sync();
        }
    },
    
    removeAll : function (silent) {
        var me = this,
            snapshot = me.snapshot,
            data = me.data;
            
        if (snapshot) {
            snapshot.removeAll(data.getRange());
        }

        if (me.buffered) {
            if (data) {
                if (silent) {
                    me.suspendEvent('clear');
                }
                me.totalCount = 0;
                if (me.allData) {
                    me.allData.clear();
                    delete me.allData;
                }
                else if (me.snapshot) {
                    me.snapshot.clear();
                    delete me.snapshot;
                }
                data.clear();
                if (silent) {
                    me.resumeEvent('clear');
                }
            }            
        }

        else {
            // Use the remove range interface to remove the entire record set, passing the silent flag.
            // The remove range interface does not fire individual remove events.
            me.remove({
                start: 0,
                end: me.getCount() - 1
            }, false, silent);
        
            me.totalCount = 0;
            if (me.allData) {
                me.allData.clear();
                delete me.allData;
            }
            else if (me.snapshot) {
                me.snapshot.clear();
                delete me.snapshot;
            }
       
            if (silent !== true) {
                me.fireEvent('clear', me);
            }
        }
    },

    getById : function (id) {
        return (this.snapshot || this.allData || this.data).findBy(function (record) {
            return record.getId() === id;
        });
    },
    
    clearData : function (isLoad) {
        var me = this,
            records,
            i;

        if (me.allData) {
            me.data = me.allData;
            delete me.allData;
        }
        else if (me.snapshot) {
            me.data = me.snapshot;
            delete me.snapshot;
        }

        if (!me.buffered && me.data) {
            records = me.data.items;
            i = records.length;

            while (i--) {
                records[i].unjoin(me);
            }
        }

        if (me.data) {
            me.data.clear();
        }

        if (isLoad !== true || me.clearRemovedOnLoad) {
            me.removed.length = 0;
        }
    },
    
    load : function (options) {
        var forceLocal = false;
        if (options === true) {
            forceLocal = true;
        }
        
        options = options || {};
        
        if (forceLocal || ((!Ext.isDefined(options.action) || options.action === "read") && this.isPaging(options))) {
            Ext.Function.defer(function () {
                this.fireEvent('beforeload', this, new Ext.data.Operation(options));
                if (this.allData) {
                    this.data = this.allData;
                    delete this.allData;
                }
                
                this.applyPaging();                
                var r = [].concat(this.data.items);
                this.fireEvent("datachanged", this, r);
                this.fireEvent("load", this, r, true);
                this.fireEvent('refresh', this);
                
                if (options.callback) {
                    options.callback.call(options.scope || this, r, options, true);
                }
            }, 1, this);
            
            return this;
        }
        
        options.isPagingStore = true;
        
        return this.callParent([options]);
    },
    
    loadRecords : function (records, options) {
        var me     = this,
            i      = 0,
            length = records.length,
            start,
            addRecords,
            snapshot = me.snapshot;

        if (options) {
            start = options.start;
            addRecords = options.addRecords;
        }

        if (!addRecords) {
            delete me.snapshot;
            me.clearData(true);
        } else if (snapshot) {
            snapshot.addAll(records);
        }
        
        me.data.addAll(records);

        if (start !== undefined) {
            for (; i < length; i++) {
                records[i].index = start + i;
                records[i].join(me);
            }
        } else {
            for (; i < length; i++) {
                records[i].join(me);
            }
        }
        
        if (!me.allData) {
            me.applyPaging();
        }
        
        me.suspendEvents();        
        
        if (me.filterOnLoad && !me.remoteFilter) {
            me.filter();
        }

        if (me.sortOnLoad && !me.remoteSort) {
            me.sort(undefined, undefined, undefined, true);
        }

        me.resumeEvents();
        if (me.isGrouped()) {
            me.constructGroups();
        }
        me.fireEvent('datachanged', me, records);
        me.fireEvent('refresh', me);
    },
    
    loadPage : function (page, options) {
        var me = this;
        
        me.currentPage = page;

        options = Ext.apply({
            isPagingRequest : true,
            page: page,
            start: (page - 1) * me.pageSize,
            limit: me.pageSize,
            addRecords: !me.clearOnPageLoad
        }, options);

        if (me.buffered) {
            options.limit = me.viewSize || me.defaultViewSize;
            return me.loadToPrefetch(options);
        }

        me.read(options);
    },
    
    getTotalCount : function () {
        if (this.allData) {
            return this.allData.getCount();
        }
        return this.totalCount || 0;
    },
    
    filterBy : function (fn, scope) {
        this.snapshot = this.snapshot || this.allData || this.data.clone();
        this.data = this.queryBy(fn, scope || this);
        this.applyPaging();
        this.fireEvent("datachanged", this);
        this.fireEvent('refresh', this);
    },
    
    queryBy : function (fn, scope) {
        var data = this.snapshot || this.allData || this.data;
        return data.filterBy(fn, scope || this);
    },

    filter: function (filters, value) {
        if (Ext.isString(filters)) {
            filters = {
                property: filters,
                value: value
            };
        }

        var me = this,
            decoded = me.decodeFilters(filters),
            i,
            doLocalSort = me.sorters.length && me.sortOnFilter && !me.remoteSort,
            length = decoded.length;

        for (i = 0; i < length; i++) {
            me.filters.replace(decoded[i]);
        }

        filters = me.filters.items;

        if (filters.length) {
            if (me.remoteFilter) {
                delete me.totalCount;
            
                if (me.buffered) {
                    me.data.clear();
                    me.loadPage(1);
                } else {
                    me.currentPage = 1;
                    me.load();
                }
            } else {
                me.snapshot = me.snapshot || me.allData || me.data.clone();
                me.data = (me.snapshot || me.allData).filter(filters);          
                
                me.constructGroups();

                if (doLocalSort) {
                    me.sort();
                    me.applyPaging();
                } else {
                    me.applyPaging();
                    // fire datachanged event if it hasn't already been fired by doSort
                    me.fireEvent('datachanged', me);
                    me.fireEvent('refresh', me);
                }
            }
        
            me.fireEvent('filterchange', me, filters);
        }
    },
    
    clearFilter : function (suppressEvent) {
        var me = this;

        me.filters.clear();

        if (me.remoteFilter) {
            // In a buffered Store, the meaing of suppressEvent is to simply clear the filters collection
            if (suppressEvent) {
                return;
            }

            delete me.totalCount;

            // For a buffered Store, we have to clear the prefetch cache because the dataset will change upon filtering.
            // Then we must prefetch the new page 1, and when that arrives, reload the visible part of the Store
            // via the guaranteedrange event
            if (me.buffered) {
                me.data.clear();
                me.loadPage(1);
            } else {
                me.currentPage = 1;
                me.load();
            }
        } else if (me.isFiltered()) {
            me.data = me.snapshot;
            delete me.snapshot;
            
            delete this.allData;
            this.applyPaging();
            me.constructGroups();

            if (suppressEvent !== true) {
                me.fireEvent('datachanged', me);
                me.fireEvent('refresh', me);
            }
        }
        me.fireEvent('filterchange', me, me.filters.items);
    },
    
    isFiltered : function () {
        return !!(this.snapshot && this.snapshot != (this.allData || this.data));
    },    
    
    collect : function (dataIndex, allowNull, bypassFilter) {
        var data = bypassFilter === true ? (this.snapshot || this.allData || this.data) : (this.allData || this.data);
         
        return data.collect(dataIndex, 'data', allowNull);
    },
    
    isPaging : function (options) {
        return options && options.isPagingRequest;
    },
    
    applyPaging : function () {
        var start = (this.currentPage - 1) * this.pageSize, 
            limit = this.pageSize;

        var allData = this.data, 
            data = new Ext.util.MixedCollection({
                getKey: Ext.data.Store.recordIdFn,
                maintainIndices: true
            });

        data.pageSize = this.pageSize;
            
        if (start >= allData.getCount()) {
            start = this.start = 0;
        }
        
        data.addAll(allData.getRange(start, start + limit - 1));
        this.allData = allData;
        this.data = data;
    },
    
    getAllRange : function (start, end) {
        return (this.allData || this.data).getRange(start, end);
    },

    findPage : function (record) {
        if ((typeof this.pageSize == "number")) {
            return Math.ceil(((this.allData || this.data).indexOf(record) + 1) / this.pageSize);
        }

        return -1;
    },

    getNewRecords : function () {
        return (this.allData || this.data).filterBy(this.filterNew).items;
    },

    
    getUpdatedRecords : function () {
        return (this.allData || this.data).filterBy(this.filterUpdated).items;
    }
});