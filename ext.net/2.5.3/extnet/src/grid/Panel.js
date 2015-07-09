
// @source src/grid/Panel.js

Ext.grid.Panel.override({
    selectionSubmit : true,
    selectionMemory : true,
    selectionMemoryEvents : true,

    getFilterPlugin : function () {
        if (this.lockedGrid) {
            Ext.log({
                msg: Ext.String.format("You are calling the getFilterPlugin method on a locking grid ({0}). Please use grid.normalGrid.getFilterPlugin() to get a filter plugin of a normal grid and grid.lockedGrid.getFilterPlugin() for a locked grid", this.id),
                level: "warn"
            });
        }

        if (this.features && Ext.isArray(this.features)) {
            for (var i = 0; i < this.features.length; i++) {
                if (this.features[i].isGridFiltersPlugin) {
                    return this.features[i];
                }
            }
        } else {
            if (this.features && this.features.isGridFiltersPlugin) {
                return this.features;
            }
        }
    },

    getFeature : function (name) {
        if (this.lockedGrid) {
            Ext.log({
                msg: Ext.String.format("You are calling the getFeature method on a locking grid ({0}). Please use grid.normalGrid.getFeature() to get a filter plugin of a normal grid and grid.lockedGrid.getFeature() for a locked grid", this.id),
                level: "warn"
            });
        }

        name = "feature." + name;
        if (this.features && Ext.isArray(this.features)) {
            for (var i = 0; i < this.features.length; i++) {
                if (this.features[i].alias == name) {
                    return this.features[i];
                }
            }
        } else {
            if (this.features && this.features.alias == name) {
                return this.features;
            }
        }
    },

    getRowEditor : function () {
        return this.editingPlugin;
    },

    getRowExpander : function () {
        if (this.plugins && Ext.isArray(this.plugins)) {
            for (var i = 0; i < this.plugins.length; i++) {
                if (this.plugins[i].isRowExpander) {
                    return this.plugins[i];
                }
            }
        } else {
            if (this.plugins && this.plugins.isRowExpander) {
                return this.plugins;
            }
        }
    },
    
    initComponent : function () {
        this.plugins = this.plugins || [];

        if (!Ext.isArray(this.plugins)) {
            this.plugins = [this.plugins];
        }
        
        if (this.selectionMemory) {
            this.initSelectionMemory();
        }    
        
        this.initSelectionSubmit();        
        this.callParent(arguments);

        if (this.lockable) {
            p = this.lockedGrid.getSelectionSubmit();
            Ext.Array.remove(this.lockedGrid.plugins, p);
            if (Ext.isFunction(p.destroy)) {
                p.destroy();
            }

            if (this.selectionMemory) {
                p = this.lockedGrid.getSelectionMemory();
                Ext.Array.remove(this.lockedGrid.plugins, p);
                if (Ext.isFunction(p.destroy)) {
                    p.destroy();
                }
            }
        }
    },
    
    initSelectionSubmit : function () {
        this.plugins.push(Ext.create('Ext.grid.plugin.SelectionSubmit', {}));
    },
    
    initSelectionMemory : function () {
        this.plugins.push(Ext.create('Ext.grid.plugin.SelectionMemory', {})); 
    },
    
    clearMemory : function () {
        if (this.selectionMemory) {
            this.getSelectionMemory().clearMemory();
        }
    },
    
    doSelection : function () {
         this.getSelectionSubmit().doSelection();
    },
    
    initSelectionData : function () {
        this.getSelectionSubmit().initSelectionData();
    },
    
    // config :
    //    - selectedOnly
    //    - visibleOnly
    //    - dirtyCellsOnly
    //    - dirtyRowsOnly
    //    - currentPageOnly
    //    - excludeId
    //    - filterRecord - function (record) - return false to exclude the record
    //    - filterField - function (record, fieldName, value) - return false to exclude the field for particular record
    getRowsValues : function (config) {
        config = config || {};

        if (this.isEditable && this.editingPlugin) {
            this.editingPlugin.completeEdit();
        }

        var records = (config.selectedOnly ? this.selModel.getSelection() : config.currentPageOnly ? this.store.getRange() : this.store.getAllRange()) || [],
            values = [],
            record,
            sIds,
            i,
            idProp = this.store.proxy.reader.getIdProperty();

        if (this.selectionMemory && config.selectedOnly && !config.currentPageOnly && this.store.isPagingStore) {
            records = [];
            sIds = this.getSelectionMemory().selectedIds;

            for (var id in sIds) {
                if (sIds.hasOwnProperty(id)) {
                    record = this.store.getById(sIds[id].id);

                    if (!Ext.isEmpty(record)) {
                        records.push(record);
                    }
                }
            }
        }

        for (i = 0; i < records.length; i++) {
            var obj = {}, dataR;

            dataR = Ext.apply(obj, records[i].data);

            if (idProp && dataR.hasOwnProperty(idProp)) {
                dataR[idProp] = config.excludeId === true ? undefined : records[i].getId();
            }
            
            config.grid = this;
            dataR = this.store.prepareRecord(dataR, records[i], config);

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },

    serialize : function (config) {
        return Ext.encode(this.getRowsValues(config));
    },
    
    // config:
    //   - selectedOnly,
    //   - visibleOnly
    //   - dirtyCellsOnly
    //   - dirtyRowsOnly
    //   - currentPageOnly
    //   - excludeId
    //   - encode
    //   - filterRecord - function (record) - return false to exclude the record
    //   - filterField - function (record, fieldName, value) - return false to exclude the field for particular record
    submitData : function (config, requestConfig) {
        config = config || {};
        config.selectedOnly = config.selectedOnly || false;
        encode = config.encode;

        var values = this.getRowsValues(config);

        if (!values || values.length === 0) {
            return false;
        }

        if (encode) {
            values = Ext.util.Format.htmlEncode(values);
            delete config.encode;
        }

        this.store._submit(values, config, requestConfig);
    },

    deleteSelected : function () {
        var selection = this.getSelectionModel().getSelection();

        if (selection && selection.length > 0) {
            this.store.remove(selection);
        }
    },

    hasSelection : function () {
        return this.getSelectionModel().hasSelection();
    },

    print : function (config) {
        Ext.net.GridPrinter.print(this, config);
    }
});