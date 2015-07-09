
// @source core/form/ComboBox.js

Ext.form.field.ComboBox.override({
    alwaysMergeItems : true,
    useHiddenField   : true,	
    simpleSubmit     : false,

    initComponent : Ext.Function.createSequence(Ext.form.field.ComboBox.prototype.initComponent, function () {
        this.initMerge();
		
		this.includeHiddenStateToSubmitData = !this.simpleSubmit;
        
        if (!Ext.isEmpty(this.selectedItems) && this.store) {
            this.setInitValue(this.selectedItems);
        }

        this.mon(this.getPicker(), "beforehide", function() { 
            this.listEl.scrollTopToRestore = this.listEl.getScrollTop(); // The GitHub issue #551
        });
    }),

    getHiddenStateName : function () {
        return this.valueHiddenName || ("_" + this.getName()+"_state");
    },
    
    getSubmitArray : function () {
        var state = [],
            value,
            record;


        if (!this.valueModels || this.valueModels.length == 0) {
            value = this.getValue();
            if (!Ext.isEmpty(value)) {
                record = this.findRecordByValue(value);

                if (!record) {
                    this.mon(this.store, "load", this.syncHiddenState, this, {single:true});
                    return [{value : value}];
                }
                
                return [{
                    value : record.get(this.valueField),
                    text  : record.get(this.displayField),
                    index : this.store.indexOf(record)
                }];
            }

            return state;
        }

        Ext.each(this.valueModels, function (model) {
            state.push({
                value : model.get(this.valueField),
                text  : model.get(this.displayField),
                index : this.store.indexOf(model)
            });
        }, this);

        return state;
    },

    getHiddenState : function (value) {        
        if (this.simpleSubmit) {
            return this.getValue();
        }

        var state = this.getSubmitArray();
        return state.length > 0 ? Ext.encode(state) : "";
    },

    initMerge : function () {
        if (this.mergeItems) {
            if (this.store.getCount() > 0) {
                this.doMerge();
            }

            if (this.store.getCount() === 0 || this.alwaysMergeItems) {
                this.mon(this.store, "load", this.doMerge, this, { single : !this.alwaysMergeItems });
            }
        }
    },

    doMerge : function () {
        for (var mi = this.mergeItems.length - 1; mi > -1; mi--) {
            var f = this.store.model.prototype.fields, dv = {};
            
            for (var i = 0; i < f.length; i++) {
                dv[f.items[i].name] = f.items[i].defaultValue;
            }
            
            if (!Ext.isEmpty(this.displayField, false)) {
                dv[this.displayField] = this.mergeItems[mi][1];
            }
            
            if (!Ext.isEmpty(this.valueField, false) && this.displayField != this.valueField) {
                dv[this.valueField] = this.mergeItems[mi][0];
            }
            
            this.store.insert(0, new this.store.model(dv));
        }
    },

    addRecord : function (values) {
        var rowIndex = this.store.data.length,
            record = this.insertRecord(rowIndex, values);
            
        return { index : rowIndex, record : record };
    },

    addItem : function (text, value) {
        var rowIndex = this.store.data.length,
            record = this.insertItem(rowIndex, text, value);
            
        return { index : rowIndex, record : record };
    },

    insertRecord : function (rowIndex, values) {
        this.store.clearFilter(true);
        values = values || {};
        
        var f = this.store.model.prototype.fields, dv = {};
        
        for (var i = 0; i < f.length; i++) {
            dv[f.items[i].name] = f.items[i].defaultValue;
        }
        
        var record = new this.store.model(dv, values[this.store.proxy.reader.getIdProperty()]);
        
        this.store.insert(rowIndex, record);        
        
        for (var v in values) {
            record.set(v, values[v]);
        }
        
        if (!Ext.isEmpty(this.store.proxy.reader.getIdProperty())) {
            record.set(this.store.proxy.reader.getIdProperty(), record.getId());
        }

        return record;
    },

    insertItem : function (rowIndex, text, value) {
        var f = this.store.model.prototype.fields, dv = {};
        
        for (var i = 0; i < f.length; i++) {
            dv[f.items[i].name] = f.items[i].defaultValue;
        }

        if (!Ext.isEmpty(this.displayField, false)) {
            dv[this.displayField] = text;
        }

        if (!Ext.isEmpty(this.valueField, false) && this.displayField != this.valueField) {
            dv[this.valueField] = value;
        }

        var record = new this.store.model(dv);
        
        this.store.insert(rowIndex, record);

        return record;
    },

    removeByField : function (field, value) {
        var index = this.store.find(field, value);
        
        if (index < 0) {
            return;
        }
        
        this.store.remove(this.store.getAt(index));
    },

    removeByIndex : function (index) {
        if (index < 0 || index >= this.store.getCount()) {
            return;
        }
        
        this.store.remove(this.store.getAt(index));
    },

    removeByValue : function (value) {
        this.removeByField(this.valueField, value);
    },

    removeByText : function (text) {
        this.removeByField(this.displayField, text);
    },
    
    setValueAndFireSelect : function (v) {
        this.setValue(v);
        this.fireEvent("select", this, this.valueModels);
    },
    
    setInitValue : function (value) {
        var set = Ext.Function.bind(function (value) {
                this.setSelectedItems(value, this.fireChangeOnLoad); 
                this.resetOriginalValue(); 
            }, this, [value ]);

        if (this.store.getCount() > 0) {
            set();
        } else {
            this.mon(this.store, "load", set, this, { single : true });
            this.setInitValueSetFunction = set;
        }
    },
    
    onLoad : Ext.Function.createInterceptor(Ext.form.ComboBox.prototype.onLoad, function () {
        if (this.mode == "single") {
            this.mode = "local";
        }
    }),
    
    createPicker : Ext.Function.createSequence(Ext.form.ComboBox.prototype.createPicker, function () {
        if (this.mode == "single" && this.store.getCount() > 0) {
            this.mode = "local";
        }
    }),

    setSelectedItems : function (items, fireChange) {
        this.clearValue();

        if (items) {
            items = Ext.Array.from(items);
            
            var rec,
                values=[];

            Ext.each(items, function (item) {                
                if (Ext.isDefined(item.value)) {
                    rec = this.findRecordByValue(item.value);

                    if(!rec && !isNaN(parseInt(item.value, 10)) && isFinite(item.value)) {
                        rec = this.findRecordByValue(parseInt(item.value, 10));
                    }

                    if (rec) {                    
                        values.push(rec);
                    }                    
                } else if (Ext.isDefined(item.text)) {
                    rec = this.findRecordByDisplay(item.text);
                    if (rec) {                    
                        values.push(rec);
                    }
                } else if (Ext.isDefined(item.index)) {
                    rec = this.store.getAt(item.index);
                    if (rec) {
                        values.push(rec);
                    }
                }
            }, this);
            
            if (fireChange !== false) {
                this.setValue(values);
            } else {
                this.suspendCheckChange++;
                this.setValue(values);
                this.suspendCheckChange--;
            }

            if (this.fireSelectOnLoad) {
                this.fireEvent("select", this, this.valueModels);
            }            
        }
    },

    onUnbindStore : function (store) { // it has been overriden because of this issue: http://forums.ext.net/showthread.php?30491
        var me = this,
            picker = me.picker;

        // The GitHub issue #515, three lines ahead.
        this.mun(this.store, "load", this.syncHiddenState, this);
        this.mun(this.store, "load", this.doMerge, this);
        this.mun(this.store, "load", this.setInitValueSetFunction, this);

        // If we'd added a local filter, remove it
        if (me.queryFilter && !store.isDestroyed) {
            me.store.removeFilter(me.queryFilter);
        }

        if (!store && picker) {
            picker.bindStore(null);
        }
    },

    // #551
    doQuery: function (queryString, forceAll, rawQuery) {
        var me = this,
            queryPlan = me.beforeQuery({
                query: queryString || '',
                rawQuery: rawQuery,
                forceAll: forceAll,
                combo: me,
                cancel: false
            }),
            listEl; // #551

        if (queryPlan === false || queryPlan.cancel) {
            return false;
        }

        if (me.queryCaching && queryPlan.query === me.lastQuery) {
            me.expand();

            // #551
            listEl = me.getPicker().listEl;

            if (listEl && listEl.scrollTopToRestore) {
                listEl.setScrollTop(listEl.scrollTopToRestore);
            }
            // End of #551
        } else {
            me.lastQuery = queryPlan.query;

            if (me.queryMode === 'local') {
                me.doLocalQuery(queryPlan);
            } else {
                me.doRemoteQuery(queryPlan);
            }
        }

        return true;
    }
});

Ext.view.BoundListKeyNav.override({
    // The GitHub issue #582
    selectHighlighted: function(e) {
        var me = this,
            boundList = me.boundList,
            highlighted = boundList.highlightedItem,
            selModel = boundList.getSelectionModel(),
            record;

        if (highlighted) {
            record = boundList.getRecord(highlighted);

            if (e.getKey() === e.ENTER || !selModel.isSelected(record)) {
                selModel.selectWithEvent(record, e);
            }
        }
    }
});