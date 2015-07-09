Ext.data.TreeStore.override({
    proxy : "page",

    onProxyLoad: function(operation) {
        var me = this,
            successful = operation.wasSuccessful(),
            records = operation.getRecords(),
            node = operation.node;

        me.loading = false;
        Ext.suspendLayouts(); // add
        node.set('loading', false);
        if (successful) {
            if (!me.clearOnLoad) {
                records = me.cleanRecords(node, records);
            }
            records = me.fillNode(node, records);
        }
        // The load event has an extra node parameter
        // (differing from the load event described in AbstractStore)
        /**
         * @event load
         * Fires whenever the store reads data from a remote data source.
         * @param {Ext.data.TreeStore} this
         * @param {Ext.data.NodeInterface} node The node that was loaded.
         * @param {Ext.data.Model[]} records An array of records.
         * @param {Boolean} successful True if the operation was successful.
         */
        // deprecate read?
        me.fireEvent('read', me, operation.node, records, successful);
        me.fireEvent('load', me, operation.node, records, successful);
        //this is a callback that would have been passed to the 'read' function and is optional
        Ext.callback(operation.callback, operation.scope || me, [records, operation, successful]);
        Ext.resumeLayouts(true);    // add
    },
    
    load : function (options) {
        options = options || {};
        options.params = options.params || {};
        
        var me = this,
            node = options.node || me.tree.getRootNode();

        if (!node) {
            node = me.setRootNode({
                expanded: true
            }, true);
        }

        options.id = node.getId();
        
        if (me.clearOnLoad) {
           if (me.clearRemovedOnLoad) {
                // clear from the removed array any nodes that were descendants of the node being reloaded so that they do not get saved on next sync.
                me.clearRemoved(node);
            }
            // temporarily remove the onNodeRemove event listener so that when removeAll is called, the removed nodes do not get added to the removed array
            me.tree.un('remove', me.onNodeRemove, me);
            // remove all the nodes
            node.removeAll(false);
            // reattach the onNodeRemove listener
            me.tree.on('remove', me.onNodeRemove, me);
        }
        
        Ext.applyIf(options, {
            node: node
        });
                
        if (node && node.data.dataPath) {
            options.params["dataPath"] = node.data.dataPath;
        }

        Ext.data.TreeStore.superclass.load.call(this, options)
        
        if (node) {
            node.set('loading', true);
        }

        return me;
    },

    //TODO: overridden due to #207. Needs to review after fixing by Sencha.
    onBeforeNodeExpand: function (node, callback, scope, args) {
        var me = this,
            reader, dataRoot, data,
            callbackArgs;

        // Children are loaded go ahead with expand
        if (node.isLoaded()) {
            callbackArgs = [node.childNodes];
            if (args) {
                callbackArgs.push.apply(callbackArgs, args);
            }
            Ext.callback(callback, scope || node, callbackArgs);
        }
        // There are unloaded child nodes in the raw data because of the lazy configuration, load them then call back.
        else if (dataRoot = (data = (node.raw || node[node.persistenceProperty])[(reader = me.getProxy().getReader()).root])) {
            me.fillNode(node, reader.extractData(dataRoot));
            //delete data[reader.root];
            delete (node.raw || node[node.persistenceProperty])[reader.root];
            callbackArgs = [node.childNodes];
            if (args) {
                callbackArgs.push.apply(callbackArgs, args);
            }
            Ext.callback(callback, scope || node, callbackArgs);
        }
        // The node is loading
        else if (node.isLoading()) {
            me.on('load', function () {
                callbackArgs = [node.childNodes];
                if (args) {
                    callbackArgs.push.apply(callbackArgs, args);
                }
                Ext.callback(callback, scope || node, callbackArgs);
            }, me, {
                single: true
            });
        }
        // Node needs loading
        else {
            me.read({
                node: node,
                callback: function () {
                    // Clear the callback, since if we're introducing a custom one,
                    // it may be re-used on reload
                    delete me.lastOptions.callback;
                    callbackArgs = [node.childNodes];
                    if (args) {
                        callbackArgs.push.apply(callbackArgs, args);
                    }
                    Ext.callback(callback, scope || node, callbackArgs);
                }
            });
        }
    }
});

Ext.data.NodeInterface.applyFields = Ext.Function.createInterceptor(Ext.data.NodeInterface.applyFields, function (modelClass, addFields) {
    addFields.push({name: 'text', type: 'string',  defaultValue: null, persist: false});
    addFields.push({name: 'dataPath', type: 'string',  defaultValue: null, persist: false});    
    addFields.push({name: 'selected', type: 'bool',  defaultValue: false, persist: false});
    addFields.push({name: 'hidden', type: 'bool',  defaultValue: false, persist: false});

    modelClass.override({
        reload : function (options) {
            var me = this;

            options = options || {};
            treeStore = me.store;
            if (treeStore) {
                options = Ext.apply({
                    node:this,
                    callback : function (records, operation, success) {
                        if (success) {
                            me.expand();
                        }
                    }
                }, options);

                treeStore.load(options);
            } 
        }
    });
});