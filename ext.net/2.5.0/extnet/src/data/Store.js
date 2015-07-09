// @source data/data/Store.js
Ext.data.StoreManager.getArrayStore = function (fieldsCount) {
    var fields = ['field1'],
        i;

    fieldsCount = fieldsCount || 1;

    for (i = 2; i <= fieldsCount; ++i) {
        fields.push('field' + i);
    }
    
    return new Ext.data.ArrayStore({
        data  : [],
        fields: fields,
        autoDestroy: true,
        autoCreated: true,
        expanded: false
    });
};

Ext.data.AbstractStore.override({
    autoDestroy: true,

    constructor : function (config) {
        var me = this;

        if (config && config.storeId) {
            var store = Ext.data.StoreManager.lookup(config.storeId);
            if (store) {
                store.destroyStore();
            }
        }

        me.callParent(arguments);

        this.addEvents("exception");
        
        if (this.proxy && this.proxy.buildRequest) {
            me.proxy.on("exception", me.onProxyException, me);            
            me.proxy.on("beforerequest", me.buildRequestParams, me);
        }
    },

    //grid performance bug
    onProxyLoad: function(operation) {
        var me = this,
            resultSet = operation.getResultSet(),
            records = operation.getRecords(),
            successful = operation.wasSuccessful();

        if (me.isDestroyed) {
            return;
        }
        
        if (resultSet) {
            me.totalCount = resultSet.total;
        }

        // Loading should be set to false before loading the records.
        // loadRecords doesn't expose any hooks or events until refresh
        // and datachanged, so by that time loading should be false
        Ext.suspendLayouts(); //add
        me.loading = false;
        if (successful) {
            me.loadRecords(records, operation);
        }

        if (me.hasListeners.load) {
            me.fireEvent('load', me, records, successful);
        }

        //TODO: deprecate this event, it should always have been 'load' instead. 'load' is now documented, 'read' is not.
        //People are definitely using this so can't deprecate safely until 2.x
        if (me.hasListeners.read) {
            me.fireEvent('read', me, records, successful);
        }
        //this is a callback that would have been passed to the 'read' function and is optional
        Ext.callback(operation.callback, operation.scope || me, [records, operation, successful]);
        Ext.resumeLayouts(true);   //add 
    },
    
    onProxyException : function (proxy, response, operation) {
        var error = operation.getError() || "Unknown error",
            message = Ext.isString(error) ? error : ("(" + error.status + ")" + error.statusText);

        this.fireEvent("exception", proxy, response, operation);
            
        if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", response, { "errorMessage": message }, null, null, null, null, operation) !== false) {
            if (this.showWarningOnFailure !== false) {
                Ext.net.DirectEvent.showFailure(response, response.responseText);
            }
        }
    },
    
    buildRequestParams : function (proxy, operation) {        
        operation.store = this;

        if (operation.allowWrite() && this.writeParameters) {
            this.buildWriteParams(operation);
        } else if (this.readParameters) {
           this.buildReadParams(operation);
        }
    },
    
    buildWriteParams : function (operation) {
        var prms = this.writeParameters(operation),
            action = operation.action;
            
        operation.params = operation.params || {};
        
        if (prms.apply) {
            if (prms.apply["all"]) {
                Ext.apply(operation.params, prms.apply["all"]);
            }
            
            if (prms.apply[action]) {
                Ext.apply(operation.params, prms.apply[action]);
            }
        }
        
        if (prms.applyIf) {
            if (prms.applyIf["all"]) {
                Ext.applyIf(operation.params, prms.applyIf["all"]);
            }
            
            if (prms.applyIf[action]) {
                Ext.applyIf(operation.params, prms.applyIf[action]);
            }
        }
    },
    
    buildReadParams : function (operation) {
        var prms = this.readParameters(operation);
        
        operation.params = operation.params || {};
        
        if (prms.apply) {
            Ext.apply(operation.params, prms.apply);
        }
        
        if (prms.applyIf) {
            Ext.applyIf(operation.params, prms.applyIf);
        }
    },
    
    createTempProxy : function (callback, proxyConfig, sync) {
        var oldProxy = this.proxy,
            proxyId = Ext.id(),
            proxy = this.serverProxy ? Ext.createByAlias('proxy.' + this.serverProxy.type, Ext.apply({
                    model  : this.model,
                    reader : {
                        type : oldProxy && oldProxy.reader && oldProxy.reader.type ? oldProxy.reader.type : "json",
                        root : oldProxy && oldProxy.reader && oldProxy.reader.root ? "data."+oldProxy.reader.root : "data"
                    },
                    writer : oldProxy.writer
                }, proxyConfig || {}, this.serverProxy)) : Ext.createByAlias('proxy.page', Ext.applyIf({
                    type   : 'page',
                    model  : this.model,
                    reader : {
                        type : oldProxy && oldProxy.reader && oldProxy.reader.type ? oldProxy.reader.type : "json",
                        root : oldProxy && oldProxy.reader && oldProxy.reader.root ? "data."+oldProxy.reader.root : "data"
                    },
                    writer : oldProxy.writer
            }, proxyConfig || {}));
        
        this.proxy = proxy;
        this[proxyId] = proxy;
        this._oldProxy = oldProxy;
        
        this.proxy.on("exception", this.onProxyException, this);            
        this.proxy.on("beforerequest", this.buildRequestParams, this);
        
        this.proxy.on("beforerequest", function () {
            this.proxy = oldProxy;            
        }, this, {single:true});

        if (sync) {
            this.proxy.onBatchComplete = Ext.Function.createInterceptor(this.proxy.onBatchComplete, 
                function (batchOptions, batch) {
                    if (callback) {
                        callback.call(this, null, !batch.hasException);
                    }
            
                    this.proxy.onDestroy(); 
                    this.proxy.clearListeners();
                    delete this.store[proxyId];
                    delete this._oldProxy;
                }, {
                    proxy    : this.proxy, 
                    oldProxy : oldProxy,
                    store    :this 
                }
            );
        }
        else {        
            this.proxy.on("afterrequest", function (proxy, request, success) {
                if (callback) {
                    callback.call(this, request, success);
                }
            
                this.proxy.onDestroy(); 
                this.proxy.clearListeners();
                delete this.store[proxyId];
            }, {
                proxy    : this.proxy, 
                oldProxy : oldProxy,
                store    :this 
            });
        }
    },

    reload: function (options) {
        return this.load(Ext.apply(this.lastOptions || {}, options));
    },

    getChangedData : function (options) {
        options = options || {};
        
        var json = {},            
            me = this,
            obj,
            newRecords = this.getNewRecords(),
            updatedRecords = this.getUpdatedRecords(),
            removedRecords = this.getRemovedRecords(),
            idProp = me.proxy && me.proxy.reader ? me.proxy.reader.getIdProperty() : "id",
            
            handleRecords = function (array) {
                var i,
                    len,
                    obj,
                    list,
                    buffer = [];
                    
                for (i = 0, len = array.length; i < len; i++) {
                    obj = {};
                    record = array[i];
                    list = Ext.apply(obj, record.data);

                    if (list.hasOwnProperty(idProp)) {
                        if (record.phantom) {
                            if (record.clientIdProperty) {
                                list[record.clientIdProperty] = record.internalId; 
                            }
                        } else {
                            list[idProp] = record.getId(); 
                        }
                    }

                    list = this.prepareRecord(list, record, options, record.phantom);
                    
                    if (record.phantom && (options.skipIdForPhantomRecords !== false) && list.hasOwnProperty(idProp)) {
                        delete list[idProp];
                        delete list[record.clientIdProperty];
                    }

                    if (!Ext.isEmptyObj(list)) {
                        buffer.push(list);
                    }
                }
                
                return buffer;
            };

        if (removedRecords.length > 0) {            
            obj = handleRecords.call(this, removedRecords);

            if (obj.length > 0) {
                json.Deleted = obj;
            }            
        }
        
        if (updatedRecords.length > 0) {            
            obj = handleRecords.call(this, updatedRecords);
            
            if (obj.length > 0) {
                json.Updated = obj;
            }            
        }
        
        if (newRecords.length > 0) {            
            obj = handleRecords.call(this, newRecords);
            
            if (obj.length > 0) {
                json.Created = obj;
            }            
        }

        return options.encode ? Ext.util.Format.htmlEncode(json) : json;
    },

    prepareRecord : function (data, record, options, isNew) {
        var newData = {},
            field,
            idProp = this.proxy && this.proxy.reader ? this.proxy.reader.getIdProperty() : "id";

        if (options.filterRecord && options.filterRecord(record) === false) {
            return;
        }

        if (options.visibleOnly && options.grid) {
            var columns = options.grid.headerCt.getVisibleGridColumns(),
                i, len;
            
            for (i=0, len = columns.length; i < len; i++) {
                newData[columns[i].dataIndex] = data[columns[i].dataIndex];
            }

            data = newData;
        }

        if (options.dirtyRowsOnly && !isNew) {
            if (!record.dirty) {
                return;
            }
        }
        
        if (options.dirtyCellsOnly === true && !isNew) {
            newData = {};

            for (var j in data) {
                if (record.isModified(j)) {
                    newData[j] = data[j];
                }
            }

            data = newData;
        }

        for (var k in data) {
            if (options.filterField && options.filterField(record, k, data[k]) === false) {
                delete data[k];
            }
        }
        
        if (options.mappings !== false && this.saveMappings !== false) {
            var m,
                map = record.fields.map, 
                mappings = {};
            
            Ext.iterate(data, function (prop, value) {            
                m = map[prop];

                if (m) {
                    mappings[m.mapping ? m.mapping : m.name] = value;
                }
            });
 
            if (options.excludeId !== true ) {
                if (record.phantom) {
                    if (record.clientIdProperty) {
                        mappings[record.clientIdProperty] = record.internalId; 
                    }
                } else {
                    mappings[idProp] = record.getId(); 
                }
            }

            data = mappings;
        }

        for (var k in data) {            
            field = this.getFieldByName(k);
            
            if (Ext.isEmpty(data[k], false) && this.isSimpleField(k, field)) {
                switch (field.submitEmptyValue) {
                case "null":
                    data[k] = null;        
                    break;
                case "emptystring":
                    data[k] = "";        
                    break;
                default:
                    delete data[k];        
                    break;
                }
            }
        }
        
        if (options.prepare) {
            options.prepare(data, record);
        }
        
        return data;
    },

    getFieldByName : function (name) {
        for (var i = 0; i < this.model.prototype.fields.getCount(); i++) {
            var field = this.model.prototype.fields.get(i);

            if (name === (field.mapping || field.name)) {
                return field;
            }
        }        
    },

    isSimpleField : function (name, field) {
        var f = field || this.getFieldByName(name),
            type = f && f.type ? f.type.type : "";

        return type === "int" || type === "float" || type === "boolean" || type === "date";
    },

    sync : function (options, proxyConfig) {        
        var me = this,
            operations = {},
            toCreate = me.getNewRecords(),
            toUpdate = me.getUpdatedRecords(),
            toDestroy = me.getRemovedRecords(),
            needsSync = false;

        if (toCreate.length > 0) {
            operations.create = toCreate;
            needsSync = true;
        }

        if (toUpdate.length > 0) {
            operations.update = toUpdate;
            needsSync = true;
        }

        if (toDestroy.length > 0) {
            operations.destroy = toDestroy;
            needsSync = true;
        }

        if (needsSync && me.fireEvent('beforesync', operations) !== false) {
            options = options || {};

            if (me.proxy instanceof Ext.data.proxy.Memory) {
                me.createTempProxy(Ext.emptyFn, proxyConfig, true);            
            }

            me.proxy.batch(Ext.apply(options, {
                operations: operations,
                listeners: me.getBatchListeners()
            }));
        }
        
        return me;
    }
});

Ext.data.Store.override({   
    dirtyWarningTitle : "Uncommitted Changes",
    dirtyWarningText : "You have uncommitted changes.  Are you sure you want to reload data?",

    constructor : function (config) {
        this.callParent(arguments);

        this.on("bulkremove", this.updateRecordIndexes, this);
    },
    
    addField : function (field, index, rebuildMeta) {
        if (typeof field == "string") {
            field = { name: field };
        }

        field = new Ext.data.Field(field);

        if (Ext.isEmpty(index) || index === -1) {
            this.model.prototype.fields.replace(field);
        } else {
            this.model.prototype.fields.insert(index, field);
        }

        if (typeof field.defaultValue != "undefined") {
            this.each(function (r) {
                if (typeof r.data[field.name] == "undefined") {
                    r.data[field.name] = field.defaultValue;
                }
            });
        }

        if (rebuildMeta && this.proxy && this.proxy.reader) {
            this.proxy.reader.buildExtractors(true);
        }
    },

    rebuildMeta : function () {
        if (this.proxy.reader) {
             this.proxy.reader.buildExtractors(true);
        }
    },

    removeFields : function () {
        this.model.prototype.fields.clear();
        this.removeAll();
    },

    removeField : function (name) {
        this.model.prototype.fields.removeAtKey(name);

        this.each(function (r) {
            delete r.data[name];

            if (r.modified) {
                delete r.modified[name];
            }
        });
    },    
    
    getRecordsValues : function (options) {
        options = options || {};

        var records = (options.records ? options.records : (options.currentPageOnly ? this.getRange() : this.getAllRange())) || [],
            values = [],
            i;

        for (i = 0; i < records.length; i++) {
            var obj = {}, 
                dataR,
                idProp = this.proxy.reader.getIdProperty();
            
            dataR = Ext.apply(obj, records[i].data);
            if (idProp && dataR.hasOwnProperty(idProp)) {
                obj[idProp] = options.excludeId === true ? undefined : records[i].getId();                        
            }
            dataR = this.prepareRecord(dataR, records[i], options);

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },
    
    isDirty : function () {
        return this.getNewRecords().length > 0 || this.getUpdatedRecords().length > 0 || this.getRemovedRecords().length > 0;
    },
    
    _load : Ext.data.Store.prototype.load,
    
    load : function (options) {
        if (this.warningOnDirty && this.isDirty()) {
            Ext.Msg.confirm(
                this.dirtyWarningTitle,
                this.dirtyWarningText,
                function (btn, text) {
                    if (btn == "yes") {
                      this._load(options);
                    }
                },
                this
            );
            
            return this;
        }
        
        return this._load(options);
    },    
    
    getAllRange : function (start, end) {
        return this.getRange(start, end);
    },

    _reload : Ext.data.Store.prototype.reload,

    reload : function (options, proxyConfig) {
        var memProxy = this.proxy instanceof Ext.data.proxy.Memory;
        if (memProxy) {
            this.createTempProxy(function (request, success) {
                if (success) {
                    if (this.store.isPagingStore && !this.store.allData) {                   
                       this.store.applyPaging();
                    }  
                    this.oldProxy.data = request._data && request._data.data ? request._data.data : {};

                    if (this.oldProxy.reader) {
                        this.oldProxy.reader.rawData = this.oldProxy.data;
                    }
                }
            }, proxyConfig);            
        }
        
        var result = this._reload(options);

        if(memProxy && !this.loading) {            
            this.proxy.onDestroy(); 
            this.proxy.clearListeners();            
            this.proxy = this._oldProxy;
            delete this.store[proxyId];
            delete this._oldProxy;
        }

        return result;
    },    
    
    commitChanges : function (actions) {
        var me = this,
            i, 
            len, 
            records,
            record;
        
        actions = Ext.apply({
            create : true,
            update : true,
            destroy : true
        }, actions || {});
        
        if (actions.create) {
            records = me.getNewRecords();
            len = records.length;
            
            if (len > 0) {
               for (i = 0; i < len; i++) {
                  record = records[i];
                  record.phantom = false;
                  record.commit();
               }
            }
        }
        
        if (actions.update) {
            records = me.getUpdatedRecords();
            len = records.length;
            
            if (len > 0) {
               for (i = 0; i < len; i++) {
                  record = records[i];
                  record.commit();
               }
            }
        }
        
        if (actions.destroy) {
            records = me.getRemovedRecords();
            len = records.length;
            
            if (len > 0) {
               this.removed = [];
            }            
        }
    },
    
    rejectChanges : function (actions) {
        var me = this, 
            i, 
            len, 
            records,
            record;
        
        actions = Ext.apply({
            create : true,
            update : true,
            destroy : true
        }, actions || {});
        
        if (actions.create) {
            records = me.getNewRecords();
            len = records.length;
            
            if (len > 0) {
               for (i = 0; i < len; i++) {
                  record = records[i];
                  me.remove(record, true);
               }
            }
        }
        
        if (actions.update) {
            records = me.getUpdatedRecords();
            len = records.length;
            
            if (len > 0) {
               for (i = 0; i < len; i++) {
                  record = records[i];
                  record.reject();
               }
            }
        }
        
        if (actions.destroy) {
            records = me.getRemovedRecords();
            len = records.length;
            
            if (records.length > 0) {
               var autoSync = me.autoSync;
               me.autoSync = false;
               me.add(records);
               me.autoSync = autoSync;
               me.removed = [];
            }            
        }
    },

    submitData : function (options, requestConfig) {
        this._submit(null, options, requestConfig);
    },

    _submit : function (data, options, requestConfig) {        
        if (!data) {
           data = this.getRecordsValues(options);
        }
        
        if (!data || data.length === 0) {
            return false;
        } 

        data = Ext.encode(data);

        if (options && options.encode) {
            data = Ext.util.Format.htmlEncode(data);
        }

        options = { params : (options && options.params) ? options.params : {} };

        if (Ext.isString(requestConfig)) {
            requestConfig = { 
				url : requestConfig
			};
        }
        
        var config = {},             
            ac = requestConfig || {},
            isClean = !!ac.url;

        ac.userSuccess = ac.success;
        ac.userFailure = ac.failure;
        delete ac.success;
        delete ac.failure;
        ac.extraParams = options.params;
        ac.enforceFailureWarning = !ac.userFailure;

        if (isClean) {
            ac.cleanRequest = true;    
            ac.extraParams = ac.extraParams || {};
            ac.extraParams.data = data;
        }
        
        Ext.apply(config, ac, {
            control   : this,
            eventType : "postback",
            action    : "submit",
            serviceParams : data
        });

        Ext.net.DirectEvent.request(config);
    },

    commitRemoving : function (id) {
        var recs = this.removed,
            len = recs.length,
            i; 

        for (i = 0; i < len; i++) { 
            if (recs[i].getId() === id) {
                Ext.Array.erase(this.removed, i, 1);
                return;
            }
        }
    },

    rejectRemoving : function (id) {
        var recs = this.removed,
            len = recs.length,
            i; 

        for (i = 0; i < len; i++) { 
            if (recs[i].getId() === id) {
                this.insert(0, recs[i]);
                recs[i].reject(); 
                Ext.Array.erase(this.removed, i, 1);
                return;
            }
        }
    },

    getByInternalId: function(internalId) {
        var result;

        if (this.buffered) {
            result = (this.snapshot || this.data).findBy(function(record) {
                return record.internalId == internalId;
            });            
        } else {
            result = this.data.get(internalId);
        }
        return result;
    },

    group: function (groupers, direction) {
        var useDefault = Ext.isString(groupers) && !this.groupers.get(groupers);
        this.callParent([groupers, direction || (useDefault ? "ASC" : direction)]);
    },

    updateRecordIndexes : function () {
        var i,
            len = this.getCount(),
            records = this.getRange(),
            start = ((this.currentPage - 1) * this.pageSize) || 0;

        for (i = 0; i < len; i++) {
            records[i].index = start + i;
        } 
    }
});

Ext.StoreManager.lookup("ext-empty-store").autoDestroy = false;