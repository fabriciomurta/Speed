// feature idea to enable Ajax loading and then the content
// cache would actually make sense. Should we dictate that they use
// data or support raw html as well?

/**
 * @class Ext.ux.RowExpander
 * @extends Ext.AbstractPlugin
 * Plugin (ptype = 'rowexpander') that adds the ability to have a Column in a grid which enables
 * a second row body which expands/contracts.  The expand/contract behavior is configurable to react
 * on clicking of the column, double click of the row, and/or hitting enter while a row is selected.
 *
 * @ptype rowexpander
 */
Ext.define('Ext.ux.RowExpander', {
    extend : 'Ext.AbstractPlugin',
    lockableScope: 'normal',

    requires : [
        'Ext.grid.feature.RowBody',
        'Ext.grid.feature.RowWrap'
    ],

    alias  : 'plugin.rowexpander',
    mixins : {
        observable : 'Ext.util.Observable'
    },

    isRowExpander : true,
    rowBodyTpl    : null,

    /**
     * @cfg {Boolean} expandOnEnter
     * <tt>true</tt> to toggle selected row(s) between expanded/collapsed when the enter
     * key is pressed (defaults to <tt>true</tt>).
     */
    expandOnEnter : true,

    /**
     * @cfg {Boolean} expandOnDblClick
     * <tt>true</tt> to toggle a row between expanded/collapsed when double clicked
     * (defaults to <tt>true</tt>).
     */
    expandOnDblClick : true,

    /**
     * @cfg {Boolean} selectRowOnExpand
     * <tt>true</tt> to select a row when clicking on the expander icon
     * (defaults to <tt>false</tt>).
     */
    selectRowOnExpand : false,

    rowBodyTrSelector : '.x-grid-rowbody-tr',
    rowBodyHiddenCls  : 'x-grid-row-body-hidden',
    rowCollapsedCls   : 'x-grid-row-collapsed',
    swallowBodyEvents : false,

    /**
     * @event expandbody
     * <b<Fired through the grid's View</b>
     * @param {HtmlElement} rowNode The &lt;tr> element which owns the expanded row.
     * @param {Ext.data.Model} record The record providing the data.
     * @param {HtmlElement} expandRow The &lt;tr> element containing the expanded data.
     */
    /**
     * @event collapsebody
     * <b<Fired through the grid's View.</b>
     * @param {HtmlElement} rowNode The &lt;tr> element which owns the expanded row.
     * @param {Ext.data.Model} record The record providing the data.
     * @param {HtmlElement} expandRow The &lt;tr> element containing the expanded data.
     */

    constructor : function () {
        var me = this,
            grid,
            rowBodyTpl,
            features;

        this.addEvents("beforeexpand", "expand", "beforecollapse", "collapse");
        this.callParent(arguments);
        this.mixins.observable.constructor.call(this);        
        
        grid = this.getCmp();
        this.recordsExpanded = {};
        this.preventsExpanding = {};
        this.bodyContent = {};

        if (!this.rowBodyTpl) {
            this.rowBodyTpl="";
        }

        if (!Ext.isEmpty(this.rowBodyTpl) && (this.loader || this.component)) {            
            this.cmpBodyTpl = (this.rowBodyTpl instanceof Ext.XTemplate) ? this.rowBodyTpl : Ext.create('Ext.XTemplate', this.rowBodyTpl);
            this.rowBodyTpl="";
        }

        var rowBodyTpl = (this.rowBodyTpl instanceof Ext.XTemplate) ? this.rowBodyTpl : Ext.create('Ext.XTemplate', this.rowBodyTpl),
            features = [{
                ftype              : 'rowbody',
                lockableScope: 'normal',
                columnId           : this.getHeaderId(),
                recordsExpanded    : this.recordsExpanded,
                rowBodyHiddenCls   : this.rowBodyHiddenCls,
                rowCollapsedCls    : this.rowCollapsedCls,
                getAdditionalData  : this.getRowBodyFeatureData,
                expander           : this,
                getRowBodyContents : function (record, data) {
                    return rowBodyTpl.applyTemplate(data) || this.expander.bodyContent[record.internalId];
                }
            },{
                ftype : 'rowwrap',
                lockableScope: 'normal'
            },
            // In case the client grid is lockable (At this stage we cannot know; plugins are constructed early)
            // push a Feature into the locked side which sets up the initially collapsed row state correctly
            {
                ftype: 'feature',
                lockableScope: 'locked',
                getAdditionalData: function (data, idx, record, result) {
                    if (!me.recordsExpanded[record.internalId]) {
                        result.rowCls = (result.rowCls || '') + ' ' + me.rowCollapsedCls;
                    }
                }
            }];

        if (grid.features) {
            grid.features = Ext.Array.push(features, grid.features);
        } else {
            grid.features = features;
        }

        this.componentsCache = [];
        this.outerComponentsCache = [];

        if (this.component && this.singleExpand === false) {
            this.componentCfg = this.component;
            delete this.component;            
        }
        
        if (this.component && !this.component.initialConfig) {
            this.component.monitorResize = true;
            this.componentCfg = this.component;
            this.component = Ext.ComponentManager.create(Ext.isFunction(this.component) ? this.component.call({expander: this}) : this.component, "panel");
        }             
    },

    getExpanded : function () {
        var store = this.getCmp().store,
            expandedRecords = [];

        store.each(function (record, index) {
            if (this.recordsExpanded[record.internalId]) {
                expandedRecords.push(record);
            }
        }, this);
        
        return expandedRecords;
    },

    init : function (grid) {
        var me = this,
            reconfigurable = grid;

        this.callParent(arguments);
        this.grid = grid;
        me.view = grid.getView();
        // Columns have to be added in init (after columns has been used to create the
        // headerCt). Otherwise, shared column configs get corrupted, e.g., if put in the prototype.
        this.addExpander();
        me.bindView(me.view);
        // If our client grid is the normal side of a lockable grid, we listen to its lockable owner's beforereconfigure
        // and also bind to the locked grid's view for dblclick and keydown events
        if (reconfigurable.ownerLockable) {
            reconfigurable = reconfigurable.ownerLockable;
            me.bindView(reconfigurable.lockedGrid.getView());
        }
        reconfigurable.on('beforereconfigure', me.beforeReconfigure, me);        
        grid.headerCt.on("columnresize", this.updateComponentsWidth, this, {delay:20, buffer : 20});
        grid.headerCt.on("columnhide", this.updateComponentsWidth, this, {delay:20, buffer : 20});
        grid.headerCt.on("columnshow", this.updateComponentsWidth, this, {delay:20, buffer : 20});
    },

    updateComponentsWidth : function () {       
        var i,
            grid = this.getCmp(),
            body,
            len = this.componentsCache.length,
            item;

        if (this.component && this.component.record && this.recordsExpanded[this.component.record.internalId]) {
            body = Ext.get(grid.view.getNode(grid.store.getByInternalId(this.component.record.internalId))).down("div.x-grid-rowbody");         
            this.component.setWidth(body.getWidth() - (this.scrollOffset || 0));
        }

        if (this.componentsCache && len > 0) {
            for (i = 0; i < len; i++) {
                item = this.componentsCache[i];
                if (this.recordsExpanded[item.id]) {                    
                    body = Ext.get(grid.view.getNode(grid.store.getByInternalId(item.id))).down("div.x-grid-rowbody");         
                    item.cmp.setWidth(body.getWidth() - (this.scrollOffset || 0));
                }
            }
        }
    },
    
    beforeReconfigure: function (grid, store, columns, oldStore, oldColumns) {
        var expander = this.getHeaderConfig();
        expander.locked = true;
        columns.unshift(expander);
    },
    
    addExpander: function () {
        var me = this,
            expanderGrid = me.grid,
            expanderHeader = me.getHeaderConfig();

        // If this is the normal side of a lockable grid, find the other side.
        if (expanderGrid.ownerLockable) {
            expanderGrid = expanderGrid.ownerLockable.lockedGrid;
            expanderGrid.width += expanderHeader.width;
        }
        expanderGrid.headerCt.insert(0, expanderHeader);
    },

    getHeaderId : function () {
        if (!this.headerId) {
            this.headerId = Ext.id();
        }
        return this.headerId;
    },

    getRowBodyFeatureData : function (data, idx, record, orig) {
        var me = this,
            o = me.self.prototype.getAdditionalData.apply(this, arguments),
            id = me.columnId;

        o.rowBodyColspan = o.rowBodyColspan - 1;
        o.rowBody = this.getRowBodyContents(record, data);
        o.rowCls = this.expander.recordsExpanded[record.internalId] ? '' : this.rowCollapsedCls;
        o.rowBodyCls = this.expander.recordsExpanded[record.internalId] ? '' : this.rowBodyHiddenCls;
        o[id + '-tdAttr'] = ' valign="top" rowspan="2" ';

        if (orig[id+'-tdAttr']) {
            o[id+'-tdAttr'] += orig[id+'-tdAttr'];
        }
        return o;
    },

    stopEventFn : function (view, e) {
        return !e.getTarget(".x-grid-rowbody", view.el);
    },

    bindView : function (view) {
        view.stopEventFn = this.stopEventFn;

        view.on("beforerefresh", function () {
            this.preventsExpanding = {};
        }, this);
        
        if (this.expandOnEnter) {
            view.on('itemkeydown', this.onKeyDown, this);
        }

        if (this.expandOnDblClick) {
            view.on('itemdblclick', this.onDblClick, this);
        }

        view.on('itemmousedown', function (view, record, item, index, e) {
            return !e.getTarget('div.x-grid-rowbody', view.el);
        }, this);

        if (this.swallowBodyEvents) {
            view.on("itemupdate", this.swallowRow, this);
            view.on("refresh", this.swallowRow, this);            
        }

        if ((this.componentCfg && this.singleExpand === false) || this.loader) {
            view.on("beforerefresh", this.mayRemoveComponents, this);            
            view.on("beforeitemupdate", this.mayRemoveComponent, this);
            view.on("beforeitemremove", this.removeComponent, this);
            view.on("refresh", this.restoreComponents, this);
            view.on("itemupdate", this.restoreSingleComponent, this);      
        }

        if (this.component) {            
            view.on("beforerefresh", this.moveComponent, this);
            view.on("beforeitemupdate", this.moveComponent, this);
            view.on("beforeitemremove", this.moveComponent, this);
            view.on("refresh", this.restoreComponent, this);
            view.on("itemupdate", this.restoreComponent, this);      
        }
    },

    moveComponent : function () {
        if (!this.componentInsideGrid) {
            return;
        }
        
        var ce = this.component.getEl(), 
            el = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();
                    
        ce.addCls("x-hidden");        
        el.dom.appendChild(ce.dom);
        this.componentInsideGrid = false;
    },

    removeComponent : function (view, record, rowIndex) {
        for (var i = 0, l = this.componentsCache.length; i < l; i++) {
            if (this.componentsCache[i].id == record.internalId) {
                try {
                    var cmp = this.componentsCache[i].cmp;
                    cmp.destroy();
                    Ext.Array.remove(this.componentsCache, this.componentsCache[i]);
                } catch (ex) { }

                break;
            }
        }
    },

    mayRemoveComponent : function (view, record, rowIndex) {
        if (this.invalidateComponentsOnRefresh) {
            this.removeComponents(view, record, rowIndex);
            return;
        }

        var item,
            ce,
            elTo;

        for (var i = 0, l = this.componentsCache.length; i < l; i++) {
            item = this.componentsCache[i];
            
            if (item.id == record.internalId) {
                ce = item.cmp.getEl();
                elTo = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();
                ce.addCls("x-hidden");        
                elTo.dom.appendChild(ce.dom);                

                this.outerComponentsCache.push(item);
                Ext.Array.remove(this.componentsCache, item);
                
                break;
            }
        }
    },

    mayRemoveComponents : function () {
        if (this.invalidateComponentsOnRefresh) {
            this.removeComponents();
            return;
        }

        var cmp,
            ce,
            elTo = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();

        for (var i = 0, l = this.componentsCache.length; i < l; i++) {
            cmp = this.componentsCache[i].cmp;
            ce = cmp.getEl();

            ce.addCls("x-hidden");        
            elTo.dom.appendChild(ce.dom);                
        }

        this.outerComponentsCache = this.componentsCache;
        this.componentsCache = [];
    },

    removeComponents : function (outer) {
        for (var i = 0, l = this.componentsCache.length; i < l; i++) {
            try {
                var cmp = this.componentsCache[i].cmp;                
                cmp.destroy();
            } catch (ex) { }
        }

        this.componentsCache = [];

        if (outer && this.outerComponentsCache) {
            for (var i = 0, l = this.outerComponentsCache.length; i < l; i++) {
                try {
                    var cmp = this.outerComponentsCache[i].cmp;                
                    cmp.destroy();
                } catch (ex) { }
            }

            this.outerComponentsCache = [];
        }
    },
    
    restoreComponent : function () {
        if (this.component.rendered === false) {
            return;
        }

        var grid = this.getCmp();
        
        grid.store.each(function (record, i) {
            if (this.recordsExpanded[record.internalId]) {
                var rowNode = grid.view.getNode(i),          
                    body = Ext.get(rowNode).down("div.x-grid-rowbody");               
                
                body.appendChild(this.component.getEl());
                this.component.removeCls("x-hidden");
                this.component.setWidth(body.getWidth() - (this.scrollOffset || 0));
                this.componentInsideGrid = true;
                return false;
            }
        }, this);

        grid.view.refreshSize();
        this.component.doLayout();
    },

    onRowCmpLoad : function (loader, response, options) {
        loader.paramsFnScope.expander.getCmp().getView().refreshSize();
        var target = loader.getTarget();
        target.doLayout ? target.doLayout() : target.doComponentLayout();
    },

    createComponent : function (record, body) {
        var rowCmp,
            needContainer,
            scope,
            box,
            loader;

        if (this.loader) {
            needContainer = !(this.loader.renderer == "html" || this.loader.renderer == "data");
            scope = {record: record, expander: this, el: body, grid : this.getCmp()};
            loader = Ext.isFunction(this.loader) ? this.loader.call(scope) : Ext.clone(this.loader);
            loader.paramsFnScope = scope;
            loader.success = this.onRowCmpLoad;

            rowCmp = Ext.create(needContainer ? "Ext.container.Container" : "Ext.Component", {
                loader : loader,        
                layout : "anchor",
                defaults : { anchor : "100%" },
                tpl : !Ext.isEmpty(this.cmpBodyTpl) ? ((this.cmpBodyTpl instanceof Ext.XTemplate) ? this.cmpBodyTpl : Ext.create('Ext.XTemplate', this.cmpBodyTpl)) : undefined
            });                            
        }
        else {
            rowCmp = Ext.ComponentManager.create(Ext.isFunction(this.componentCfg) ? this.componentCfg.call({record: record, expander: this}) : Ext.clone(this.componentCfg), "panel");
        }      

        //box = Ext.util.Format.parseBox(this.componentMargin || 0);

        if (this.componentMargin) {
            rowCmp.margin = this.componentMargin;
        }
        
        rowCmp.ownerCt = this.getCmp();
        rowCmp.record = record;
        rowCmp.width = body.getWidth() - (this.scrollOffset || 0);
        rowCmp.render(body);
        rowCmp.addCls("x-row-expander-control");
        this.componentsCache.push({id: record.internalId, cmp: rowCmp});
        return rowCmp;
    },

    restoreSingleComponent : function (record, index, node) {
       var grid = this.getCmp();       
        
       if (this.recordsExpanded[record.internalId]) {
            var rowNode = grid.view.getNode(index),          
                body = Ext.get(rowNode).down("div.x-grid-rowbody"),
                rowCmp = this.getComponent(record, body);                               
                
            if (!rowCmp) {                    
                rowCmp = this.createComponent(record, body);
            }

            grid.view.refreshSize();
            rowCmp.doLayout ? rowCmp.doLayout() : rowCmp.doComponentLayout();
        }        
    },

    restoreComponents : function () {
        var grid = this.getCmp(),
        cmps = [];
        
        grid.store.each(function (record, i) {
            if (this.recordsExpanded[record.internalId]) {
                var rowNode = grid.view.getNode(i),          
                    body = Ext.get(rowNode).down("div.x-grid-rowbody"),
                    rowCmp = this.getComponent(record, body);                               
                
                if (!rowCmp) {                    
                    rowCmp = this.createComponent(record, body);
                }

                cmps.push(rowCmp);
            }
        }, this);

        this.removeOuterOrphans();

        grid.view.refreshSize();
        Ext.each(cmps, function (cmp) {
            cmp.doLayout ? cmp.doLayout() : cmp.doComponentLayout();
        });        
    },

    removeOuterOrphans : function () {
        if (this.outerComponentsCache && this.outerComponentsCache.length > 0) {
            var len = this.outerComponentsCache.length,
                store = this.getCmp().store,
                records = store.data.items,
                len2 = records.length,
                r,
                found,
                i = 0,
                item;

            while (i < len) {
                item = this.outerComponentsCache[i];
                found = false;

                for (r = 0; r < len2; r++) {
                    if (records[r].internalId == item.id) {
                        found = true;
                        break;
                    }    
                }

                if (!found) {
                    try {
                        item.cmp.destroy();
                    } catch (ex) { }
                    Ext.Array.remove(this.outerComponentsCache, item);
                    len--;
                }
                else {
                    i++;
                }
            }
        }
    },

    swallowRow : function () {
        var grid = this.getCmp();

        grid.store.each(function (record, i) {
            if (this.recordsExpanded[record.internalId]) {
                var rowNode = grid.view.getNode(i),          
                    body = Ext.get(rowNode).down(this.rowBodyTrSelector);                
                
                body.swallowEvent(['click', 'mousedown', 'mousemove', 'mouseup', 'dblclick'], false);
            }
        }, this);
    },

    onKeyDown: function (view, record, row, rowIdx, e) {
        if (e.getKey() == e.ENTER) {
            var ds   = view.store,
                sels = view.getSelectionModel().getSelection(),
                ln   = sels.length,
                i = 0;

            for (; i < ln; i++) {
                if (!this.preventsExpanding[sels[i].internalId]) {
                    rowIdx = ds.indexOf(sels[i]);
                    this.toggleRow(rowIdx, sels[i]);
                }
            }
        }
    },

    beforeExpand : function (record, body, rowNode, rowIndex) {
        if (this.fireEvent("beforeexpand", this, record, body, rowNode, rowIndex) !== false) {
            if (this.singleExpand || this.component) {
                this.collapseAll();
            }

            return true;
        } else {
            return false;
        }
    },

    expandAll : function () {
        if (this.singleExpand || this.component) {
            return;
        }
        
        var i = 0,
            store = this.getCmp().store,
            len = store.getCount();

        for (i; i < len; i++) {
            this.toggleRow(i, store.getAt(i), true);
        }
    },
    
    collapseAll : function () {
        var i = 0,
            store = this.getCmp().store,
            len = store.getCount();

        for (i; i < len; i++) {
            this.toggleRow(i, store.getAt(i), false);
        }
        this.recordsExpanded = {};
    },

    collapseRow : function (row) {        
        this.toggleRow(row, this.view.getRecord(this.view.getNode(row)), false);
    },

    expandRow : function (row) {        
        this.toggleRow(row, this.view.getRecord(this.view.getNode(row)), true);
    },

    toggleRow : function (rowIdx, record, state) {
        var me = this,
            view = this.view,
	        rowNode = this.view.getNode(rowIdx),
            row = Ext.get(rowNode),
            nextBd = row.down(this.rowBodyTrSelector),
            body = row.down("div.x-grid-rowbody"),       
            hasState = Ext.isDefined(state),
            isCollapsed = row.hasCls(me.rowCollapsedCls),
            addOrRemoveCls = isCollapsed ? 'removeCls' : 'addCls',
            grid = this.getCmp(),
            rowCmp,
            needContainer,
            rowHeight;

        rowIdx = grid.store.indexOf(record);
        //Ext.suspendLayouts();
        if ((row.hasCls(this.rowCollapsedCls) && !hasState) || (hasState && state === true && row.hasCls(this.rowCollapsedCls))) {
            if (this.beforeExpand(record, nextBd, rowNode, rowIdx)) {
                row.removeCls(this.rowCollapsedCls);
                nextBd.removeCls(this.rowBodyHiddenCls);
                this.recordsExpanded[record.internalId] = true;
                
                if (this.component) {
                    if (this.recreateComponent) {
                        this.component.destroy();
                        this.component = Ext.ComponentManager.create(Ext.isFunction(this.componentCfg) ? this.componentCfg.call({record: record, expander: this}) : this.componentCfg, "panel");
                    }
                
                    if (this.component.rendered) {                    
                        body.appendChild(this.component.getEl());
                        this.component.setWidth(body.getWidth() - (this.scrollOffset || 0));
                    } else {
                        this.component.width = body.getWidth() - (this.scrollOffset || 0);
                        this.component.render(body);
                    }
                
                    this.component.addCls("x-row-expander-control");
                    this.component.removeCls("x-hidden");
                
                    this.componentInsideGrid = true;                    
                    rowCmp = this.component;
                }
                else if (this.componentCfg || this.loader) {
                    rowCmp = this.getComponent(record, body);
                    if (!rowCmp) {                        
                        rowCmp = this.createComponent(record, body);
                    }
                }

                if (this.swallowBodyEvents) {
                    this.swallowRow();
                }

		        view.refreshSize();

                if (rowCmp) {
                    rowCmp.record = record;
                    rowCmp.doLayout ? rowCmp.doLayout() : rowCmp.doComponentLayout();
                }
                
                this.fireEvent('expand', this, record, nextBd, rowNode, rowIdx);
            }
        } else if ((!row.hasCls(this.rowCollapsedCls) && !hasState) || (hasState && state === false && !row.hasCls(this.rowCollapsedCls))) {
            if (this.fireEvent("beforecollapse", this, record, nextBd, rowNode, rowIdx) !== false) {
                row.addCls(this.rowCollapsedCls);
                nextBd.addCls(this.rowBodyHiddenCls);
                this.recordsExpanded[record.internalId] = false;
		        view.refreshSize();         
                this.fireEvent('collapse', this, record, nextBd, rowNode, rowIdx);
            }
        }

        // Sync the height and class of the row on the locked side
        if (me.grid.ownerLockable) {
            view = me.grid.ownerLockable.lockedGrid.view;
            rowHeight = row.getHeight();
            row = Ext.fly(view.getNode(rowIdx), '_rowExpander');
            row.setHeight(rowHeight);
            row[addOrRemoveCls](me.rowCollapsedCls);
            view.refreshSize();
        }
       // Ext.resumeLayouts(true);
    },

    onDblClick : function (view, record, row, rowIdx, e) {
        if (!this.preventsExpanding[record.internalId] && !e.getTarget(this.rowBodyTrSelector, view.el)) {
            this.toggleRow(rowIdx, record);
        }
    },

    renderer : Ext.emptyFn,

    getHeaderConfig: function () {
        var me = this;

        return {
            id: me.getHeaderId(),
            width: 24,
            lockable: false,
            sortable: false,
            resizable: false,
            draggable: false,
            hideable: false,
            menuDisabled: true,
            cls: Ext.baseCSSPrefix + 'grid-header-special',
            renderer: function (value, metadata, record) {
                metadata.tdCls = Ext.baseCSSPrefix + 'grid-cell-special';
                var res = me.renderer.apply(this, arguments);
                if (res === false) {
                    res = "&#160;";
                    me.preventsExpanding[record.internalId] = true;
                }
                else if (res === true) {
                    res = null;
                }
                return res ? res : ('<div class="' + Ext.baseCSSPrefix + 'grid-row-expander">&#160;</div>');
            },
            processEvent: function (type, view, cell, rowIndex, cellIndex, e, record) {
                if (type == "mousedown" && e.getTarget('.x-grid-row-expander')) {
                    me.toggleRow(rowIndex, record);
                    return me.selectRowOnExpand;
                }
            }
        };
    },

    isCollapsed : function (row) {
        if (typeof row === "number") {
            row = this.view.getNode(row);
        }

        return Ext.fly(row).hasClass(this.rowCollapsedCls);
    },
    
    isExpanded : function (row) {
        if (typeof row === "number") {
            row = this.view.getNode(row);
        }

        return !Ext.fly(row).hasClass(this.rowCollapsedCls);
    },

    getComponent : function (record, body) {
        var i, l, item, cmp;

        if (this.componentsCache) {
            for (i = 0, l = this.componentsCache.length; i < l; i++) {
                item = this.componentsCache[i];
                if (item.id == record.internalId) {
                    if (body) {
                        item.cmp.setWidth(body.getWidth() - (this.scrollOffset || 0));
                    }
                    return item.cmp;
                }
            }
        }

        if (this.outerComponentsCache) {
            for (i = 0, l = this.outerComponentsCache.length; i < l; i++) {
                if (this.outerComponentsCache[i].id == record.internalId) {
                    item = this.outerComponentsCache[i];
                    cmp = item.cmp;

                    if (body) {
                        body.appendChild(cmp.getEl());
                        cmp.removeCls("x-hidden");
                        cmp.setWidth(body.getWidth() - (this.scrollOffset || 0));
                        Ext.Array.remove(this.outerComponentsCache, item);
                        this.componentsCache.push(item);
                    }
                
                    return cmp;
                }
            }
        }

        return null;
    },

    destroy : function () {
        if (this.component && Ext.isFunction(this.component.destroy)) {
            this.component.destroy();
        }

        if (this.componentsCache) {
            this.removeComponents(true);
        }
    }
});