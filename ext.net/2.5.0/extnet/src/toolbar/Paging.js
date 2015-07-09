
// @source core/toolbar/Paging.js

Ext.toolbar.Paging.prototype.initComponent = Ext.Function.createSequence(Ext.toolbar.Paging.prototype.initComponent, function () {
    if (this.hideRefresh) {
        this.child("#refresh").hide();
    }
});

Ext.toolbar.Paging.override({
    bindStore: function(store, initial, propertyName) { 
        var isEmpty = store === 'ext-empty-store' && initial;

        if (store && !isEmpty) {
            store = Ext.data.StoreManager.lookup(store); 
        }
        
        if (!store || isEmpty) {
            if (this.ownerCt) {
                store = this.findStore();
            }
            else {
                store = 'ext-empty-store';
                this.needFindStore = true;
            }
        }
        
        this.callParent([store, initial, propertyName]);
    },

    findStore: function () {
        var storeOwner = this.up('{store}');
        return storeOwner ? storeOwner.store : 'ext-empty-store';
    },

    onAdded: function () {
        this.callParent(arguments);

        if (this.needFindStore) {
            this.bindStore(this.findStore());
            delete this.needFindStore;
        }        
    },
    
    getStoreListeners: function () {
        return {
            beforeload: this.beforeLoad,
            load: this.onStoreLoad,
            exception: this.onLoadError,
            datachanged : this.onLoad,
            add         : this.onLoad,
            remove      : this.onLoad,
            clear: this.onClear
        };
    },
    
    onClear : function () {
        this.store.currentPage = 1;
        this.onLoad();
    },

    doRefresh : function () {
        var me = this,
            current = me.store.currentPage;
        
        if (me.fireEvent('beforechange', me, current) !== false) {
            if (me.store.isPagingStore) {
               me.store.reload();
            } else {
                me.store.loadPage(current);
            }
        }
    },

    onStoreLoad : function () {
        this.onLoad(true);
    },
    
    onLoad : function (isLoad) {
        var me = this,
            pageData,
            currPage,
            pageCount,
            afterText,
            total,
            isEmpty,
            item;
            
        if (!me.rendered) {
            if (!me.updateAfterRender) {
                me.updateAfterRender = true;
                this.on("afterrender", me.onLoad, me, {single: true});
            }
            return;
        }

        delete me.updateAfterRender;
        
        pageData = me.getPageData();
        currPage = pageData.currentPage;
        total = pageData.total;
        pageCount = pageData.pageCount;
        isEmpty = pageCount === 0;
        afterText = Ext.String.format(me.afterPageText, isNaN(pageCount) ? 1 : pageCount);
        
        if (total === 0 || currPage > pageCount) {
            currPage = 1;
            me.store.currentPage = 1;
        }        

        Ext.suspendLayouts();
        item = me.child('#afterTextItem');
        if (item) {    
            item.setText(afterText);
        }
        item = me.getInputItem();
        if (item) {
            item.setDisabled(isEmpty).setValue(currPage);
        }
        me.setChildDisabled('#first', currPage === 1 || isEmpty);
        me.setChildDisabled('#prev', currPage === 1 || isEmpty);
        me.setChildDisabled('#next', currPage === pageCount  || isEmpty);
        me.setChildDisabled('#last', currPage === pageCount  || isEmpty);
        me.setChildDisabled('#refresh', false);
        me.updateInfo();
        Ext.resumeLayouts(true);

        if (me.rendered && isLoad === true) {
            me.fireEvent('change', me, pageData);
        }
    },

    updateInfo : function () {
        var me = this,
            displayItem = me.child('#displayItem'),
            pageData = me.getPageData(),
            msg;

        if (displayItem) {
            if (pageData.pageCount === 0) {
                msg = me.emptyMsg;
            } else {
                msg = Ext.String.format(
                    me.displayMsg,
                    pageData.fromRecord,
                    pageData.toRecord,
                    pageData.total
                );
            }
            displayItem.setText(msg);
        }
    }
});