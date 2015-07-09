Ext.grid.ColumnComponentLayout.override({
    getContentHeight : function (ownerContext) {
        // If we are a group header return container layout's contentHeight, else default to AutoComponent's answer
        return this.owner.isGroupHeader || this.owner.isComponentHeader ? ownerContext.getProp('contentHeight') : Ext.grid.ColumnComponentLayout.superclass.getContentHeight.apply(this, arguments);
    },

    calculateOwnerHeightFromContentHeight : function (ownerContext, contentHeight) {
        var result = Ext.grid.ColumnComponentLayout.superclass.calculateOwnerHeightFromContentHeight.apply(this, arguments);
        if (this.owner.isGroupHeader || this.owner.isComponentHeader) {
            result += (this.owner.titleEl || this.owner.el).dom.offsetHeight;
        }
        return result;
    }
});

Ext.grid.column.Column.override({
    hideTitleEl : false,
    
    initComponent : function () {
        var me = this;
        
        if (me.headerItems) {
            me.isComponentHeader = true;
            me.cls = (me.cls||'') + ' ' + Ext.baseCSSPrefix + 'group-header';
            me.items = [{
                xtype    : "container",
                flex     : 1,
                cls      : Ext.baseCSSPrefix + 'grid-header-widgets',
                border   : false,
                layout   : 'anchor',
                margins  : {top:1, left:1, right:1, bottom:0},
                defaults : {anchor: "100%"},   
                items    : me.headerItems
            }];
            delete me.headerItems;
        }             
        
        if (me.isCellCommand && me.commands && !me.isCommandColumn) {            
            me.userRenderer = me.renderer;
            me.renderer = Ext.Function.bind(me.cellCommandRenderer, me);
            me.addEvents("command");
        }

        this.callParent();

        if (me.isComponentHeader) {
            me.layout = Ext.apply({
                type : 'hbox'
            });
            me.isContainer = true;
        }

        if (me.wrap) {
            if (!Ext.isString(me.tdCls)) {
                me.tdCls = "";
            }
    
            me.tdCls += " x-grid-cell-wrap";
        }
    },

    afterHide : function () {
        this.callParent(arguments);

        Ext.select(".x-grid-cell-" + this.id).addCls("x-hide-command");
    },

    afterShow : function () {
        this.callParent(arguments);

        Ext.select(".x-grid-cell-" + this.id).removeCls("x-hide-command");
    },

    afterRender : function () {
        this.callParent(arguments);

        if (this.initialConfig.flex && this.grid) {
            this.grid.on("afterlayout", function () {
                if (this.rendered) {
                    Ext.AbstractComponent.updateLayout(this);
                }
            }, this, {delay:10});            
        }

        if (this.hideTitleEl) {
            this.titleEl.setDisplayed(false);
        }
    },
    
    initRenderData:  function () {
        var me = this;

        if (!me.grid) {
            me.grid = me.up('tablepanel');
        }

        return this.callParent(arguments);
    },

    setPadding: function (headerHeight) {
        var me = this,
            lineHeight = parseInt(me.textEl.getStyle('line-height'), 10),
            textHeight = me.textEl.dom.offsetHeight,
            titleEl = me.titleEl,
            availableHeight = headerHeight - me.el.getBorderWidth('tb'),
            titleElHeight;

        // Top title containing element must stretch to match height of sibling group headers
        if (!me.isGroupHeader && !me.isComponentHeader) {
            if (titleEl.getHeight() < availableHeight) {
                titleEl.setHeight(availableHeight);
                // the column el's parent element (the 'innerCt') may have an incorrect height
                // at this point because it may have been shrink wrapped prior to the titleEl's
                // height being set, so we need to sync it up here
                me.ownerCt.layout.innerCt.setHeight(headerHeight);
            }
        }
        titleElHeight = titleEl.getViewSize().height;

        // Vertically center the header text in potentially vertically stretched header
        if (textHeight) {
            if (lineHeight) {
                textHeight = Math.ceil(textHeight / lineHeight) * lineHeight;
            }
            titleEl.setStyle({
                paddingTop: Math.floor(Math.max(((titleElHeight - textHeight) / 2), 0)) + 'px'
            });
        }

        // Only IE needs this
        if (Ext.isIE && me.triggerEl) {
            me.triggerEl.setHeight(titleElHeight);
        }
    },

    onElClick : Ext.Function.createInterceptor(Ext.grid.column.Column.prototype.onElClick, function (e, t) {
        if (e.getTarget('.x-grid-header-widgets', this.getOwnerHeaderCt())) {
            return false;
        }
    }),
    
    onElDblClick : Ext.Function.createInterceptor(Ext.grid.column.Column.prototype.onElDblClick, function (e, t) {
        if (e.getTarget('.x-grid-header-widgets', this.getOwnerHeaderCt())) {
            return false;
        }
    }),    
    
    cellCommandTemplate :
		'<div class="cell-imagecommands <tpl if="rightValue === true">cell-imagecommand-right-value</tpl>">' +
		  '<tpl if="rightAlign === true && rightValue === false"><div class="cell-imagecommand-value">{value}</div></tpl>' +
		  '<tpl for="commands">' +
		     '<div cmd="{command}" class="cell-imagecommand <tpl if="parent.rightAlign === false">left-cell-imagecommand</tpl> {cls} {iconCls} {hideCls}" ' +
		     'style="{style}" data-qtip="{qtext}" data-qtitle="{qtitle}">' +
		        '<tpl if="text"><span data-qtip="{qtext}" data-qtitle="{qtitle}">{text}</span></tpl>' +
		     '</div>' +
		  '</tpl>' +
		  '<tpl if="rightAlign === false || rightValue === true"><div class="cell-imagecommand-value">{value}</div></tpl>' +
		'</div>',

    getCellCommandTemplate : function () {
        if (Ext.isEmpty(this.cellTemplate)) {
            this.cellTemplate = new Ext.XTemplate(this.cellCommandTemplate);
        }

        return this.cellTemplate;
    },

    processEvent : function (type, view, cell, recordIndex, cellIndex, e) {
        var me = this,
            match = e.getTarget(".cell-imagecommand", 5);
            
        if (match) {
            if (type == 'click') {
                me.onCellCommandClick(view, e, match, cell, recordIndex, cellIndex);                
            } else if (type == "mousedown") {
                return false;
            }
        }

        if (type == "mousedown" && this.stopSelectionSelectors) {
            var i = 0,
                s = this.stopSelectionSelectors;

            for (i; i < s.length; i++) {
                if (e.getTarget(s[i], cell)) {
                    return false;
                }
            }
        }
        
        return me.fireEvent.apply(me, arguments); 
    },
    
    cellCommandRenderer : function (value, meta, record, row, col, store, view) {                
        var me = this;

        if (me.commands && me.commands.length > 0 && me.isCellCommand) {
            var rightAlign = me.rightCommandAlign === false ? false : true,
                preparedCommands = [],
                commands = me.commands,
                i,
                cmd,
                command,
                userRendererValue;

            for (i = 0; i < commands.length; i++) {
                cmd = commands[i];                

                if (cmd.iconCls && cmd.iconCls.charAt(0) === '#') {
                    cmd.iconCls = X.net.RM.getIcon(cmd.iconCls.substring(1));
                }
            }
                
            if (me.prepareCommands) {                
                commands = Ext.net.clone(me.commands);
                me.prepareCommands(me.grid, commands, record, row, col, value);
            }    
                
            for (i = rightAlign ? (commands.length - 1) : 0; rightAlign ? (i >= 0) : (i < commands.length); rightAlign ? i-- : i++) {
                cmd = commands[i];
                
                cmd.tooltip = cmd.tooltip || {};

                if (cmd.iconCls && cmd.iconCls.charAt(0) === '#') {
                    cmd.iconCls = X.net.RM.getIcon(cmd.iconCls.substring(1));
                }
                
                command = {
                    command  : cmd.command,
                    cls      : cmd.cls,
                    iconCls  : cmd.iconCls,
                    hidden   : cmd.hidden,
                    disabled : cmd.disabled,
                    text     : cmd.text,
                    style    : cmd.style,
                    qtext    : cmd.tooltip.text,
                    qtitle   : cmd.tooltip.title,
                    hideMode : cmd.hideMode
                };

                if (me.prepareCommand) {
                    me.prepareCommand(me.grid, command, record, row, col, value);
                }

                if (command.disabled) {
                    command.cls = (command.cls || "") + " x-imagecommand-disabled";
                }

                if (command.hidden) {
                    command.hideCls = "x-hide-" + (command.hideMode || "display");
                }

                preparedCommands.push(command);
            }

            userRendererValue = value;
            
            if (typeof me.userRenderer === "string") {
                me.userRenderer = Ext.util.Format[me.userRenderer];
            }

            if (typeof me.userRenderer === "function") {
                userRendererValue = me.userRenderer.call(
                    me.scope || me.ownerCt,
                    value,
                    meta,
                    record,
                    row,
                    col,
                    store,
                    view
                );
            } 
            
            meta.tdCls = meta.tdCls || "";
            meta.tdCls += " cell-imagecommand-cell";

            if (me.isHidden()) {
                meta.tdCls += " x-hide-command";
            }

            return me.getCellCommandTemplate().apply({
                commands   : preparedCommands,
                value      : userRendererValue,
                rightAlign : rightAlign,
                rightValue : me.align == "right"
            });
        } else {
            meta.tdCls = meta.tdCls || "";
            meta.tdCls += " cell-no-imagecommand";
        }
        
        if (typeof me.userRenderer === "string") {
            me.userRenderer = Ext.util.Format[me.userRenderer];
        }

        if (typeof me.userRenderer === "function") {
            value = me.userRenderer.call(
                me.scope || me.ownerCt,
                value,
                meta,
                record,
                row,
                col,
                store,
                view
            );
        } 

        return value;
    },

    onCellCommandClick : function (view, e, target, cell, recordIndex, cellIndex) {
        var cmd = Ext.fly(target).getAttributeNS("", "cmd"),
            owner = this.grid,
            store = owner.getStore(),
            record = store.getAt ? store.getAt(recordIndex) : view.getRecord(view.getNode(recordIndex));
 
        if (Ext.isEmpty(cmd, false) || Ext.fly(target).hasCls("x-imagecommand-disabled")) {
            return;
        }
 
        this.fireEvent("command", this, cmd, record, recordIndex, cellIndex);
    },

    beforeDestroy : function () {
        if (this.editors) {
            Ext.destroy(this.editors);
        }
        this.callParent(arguments);
    }
});