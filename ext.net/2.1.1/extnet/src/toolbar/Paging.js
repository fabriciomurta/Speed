
// @source core/toolbar/Paging.js

Ext.toolbar.Paging.prototype.initComponent = Ext.Function.createSequence(Ext.toolbar.Paging.prototype.initComponent, function () {
    if (this.hideRefresh) {
        this.child("#refresh").hide();
    }
});

Ext.toolbar.Paging.override({
    getStoreListeners: function () {
        return {
            beforeload: this.beforeLoad,
            load: this.onLoad,
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
    
    onLoad : function () {
        var me = this,
            pageData,
            currPage,
            pageCount,
            afterText,
            total,
            isEmpty;
            
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
        me.child('#afterTextItem').setText(afterText);
        me.child('#inputItem').setDisabled(isEmpty).setValue(currPage);
        me.child('#first').setDisabled(currPage === 1 || isEmpty);
        me.child('#prev').setDisabled(currPage === 1  || isEmpty);
        me.child('#next').setDisabled(currPage === pageCount  || isEmpty);
        me.child('#last').setDisabled(currPage === pageCount  || isEmpty);
        me.child('#refresh').enable();
        me.updateInfo();
        Ext.resumeLayouts(true);

        if (me.rendered) {
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