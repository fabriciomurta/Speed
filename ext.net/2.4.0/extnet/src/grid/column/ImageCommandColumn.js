Ext.define('Ext.grid.column.ImageCommand', {
    extend       : 'Ext.grid.column.Column',
    alias        : 'widget.imagecommandcolumn',
    commandWidth : 18,
    dataIndex    : "",        
    menuDisabled : true,
    sortable     : false,
    hideable     : false,
    isColumn     : true,
    isCommandColumn : true,
    adjustmentWidth : 4,
    
    constructor : function (config) {
        var me = this;        
        me.callParent(arguments);
        
        me.addEvents("command", "groupcommand");
        me.commands = me.commands || [];
        
        if (me.autoWidth) {
            me.width = me.minWidth = me.commandWidth * me.commands.length + me.adjustmentWidth;
            me.fixed = true;
        }
        
        me.renderer = Ext.Function.bind(me.renderer, me); 
    },
    
    initRenderData : function () {
        var me = this;          
        me.grid = me.up('tablepanel');
        me.grid.addCls("x-grid-group-imagecommand");
        var groupFeature = me.getGroupingFeature(me.grid);
        
        if (me.groupCommands && groupFeature) {
            me.grid.view.on('groupclick', me.onGroupClick, me);

            me.grid.view.on('containerclick', me.onClick, me);
            groupFeature.groupHeaderTpl = '<div class="group-row-imagecommand-cell">' + groupFeature.groupHeaderTpl + '</div>' + this.groupCommandTemplate;
            groupFeature.commandColumn = me;    
            groupFeature.setupRowData = Ext.Function.createSequence(groupFeature.setupRowData, this.getGroupData, this);        
        }
        
        return me.callParent(arguments);
    },

    afterHide : function () {
        this.callParent(arguments);

        Ext.select(".x-grid-cell-" + this.id).addCls("x-hide-command");
    },

    afterShow : function () {
        this.callParent(arguments);

        Ext.select(".x-grid-cell-" + this.id).removeCls("x-hide-command");
    },
    
    getGroupData : function (record, idx, rowValues) {
        var preparedCommands = [], 
            i,
            cmd,
            command,
            groupCommands = this.groupCommands;

        if (!rowValues.isFirstRow) {
            return;
        }

        for (i = 0; i < groupCommands.length; i++) {
            cmd = groupCommands[i];                

            if (cmd.iconCls && cmd.iconCls.charAt(0) === '#') {
                cmd.iconCls = X.net.RM.getIcon(cmd.iconCls.substring(1));
            }
        }
            
        //group.cls = (group.cls || "") + " group-imagecmd-ct";
        
        var groupId = record.get(this.getGroupingFeature(this.grid).refreshData.groupField),
            records = groupId ? this.grid.store.getGroups(groupId).children : null;
        
        if (this.prepareGroupCommands) {  
            groupCommands = Ext.net.clone(this.groupCommands);
            this.prepareGroupCommands(this.grid, groupCommands, groupId, records);
        }
        
        for (i = 0; i < groupCommands.length; i++) {
            cmd = groupCommands[i];
            
            cmd.tooltip = cmd.tooltip || {};

            if (cmd.iconCls && cmd.iconCls.charAt(0) === '#') {
                cmd.iconCls = X.net.RM.getIcon(cmd.iconCls.substring(1));
            }
            
            command = {
                command    : cmd.command,
                cls        : cmd.cls,
                iconCls    : cmd.iconCls,
                hidden     : cmd.hidden,
                disabled   : cmd.disabled,
                text       : cmd.text,
                style      : cmd.style,
                qtext      : cmd.tooltip.text,
                qtitle     : cmd.tooltip.title,
                hideMode   : cmd.hideMode,
                rightAlign : cmd.rightAlign || false
            };                  
            
            if (this.prepareGroupCommand) {
                this.prepareGroupCommand(this.grid, command, groupId, records);
            }

            if (command.iconCls && command.iconCls.charAt(0) === '#') {
                command.iconCls = X.net.RM.getIcon(command.iconCls.substring(1));
            }

            if (command.disabled) {
                command.cls = (command.cls || "") + " x-imagecommand-disabled";
            }

            if (command.hidden) {
                var hideMode = command.hideMode || "display";
                command.hideCls = "x-hide-" + hideMode;
            }

            if (command.rightAlign) {
                command.align = "right-group-imagecommand";
            } else {
                command.align = "";
            }

            preparedCommands.push(command);
        }
        rowValues.groupInfo.commands = preparedCommands;
    },
    
    getGroupingFeature : function (grid) {
        return grid.groupingFeature;
    },
    
    processEvent : function (type, view, cell, recordIndex, cellIndex, e) {
        var me = this,
            match = e.getTarget(".row-imagecommand", 3);
            
        if (match) {
            if (type == 'click') {
                this.onClick(view, e, recordIndex, cellIndex);                
            } else if (type == 'mousedown') {
                return false;
            }

            if ((type == 'click' || type == 'mousedown') && me.stopSelection !== false) {
                return false;
            }
        }
        return me.callParent(arguments);
    },

    onGroupClick : function (view, rowElement, groupName, e) {
        var t = e.getTarget(".group-row-imagecommand"),
            cmd;
        
        if (t) {
            var groupField = this.grid.store.groupField;

            cmd = Ext.fly(t).getAttributeNS("", "cmd");
            
            if (Ext.isEmpty(cmd, false) || Ext.fly(t).hasCls("x-imagecommand-disabled")) {
                return;
            }

            this.fireEvent("groupcommand", this, cmd, this.grid.store.getGroups(groupName));
        }

        return !t;
    },

    onClick : function (view, e, recordIndex, cellIndex) {
        var view = this.grid.getView(), 
            cmd,
            record,
            t = e.getTarget(".row-imagecommand");
            
        if (t) {
            cmd = Ext.fly(t).getAttributeNS("", "cmd");
            
            if (Ext.isEmpty(cmd, false) || Ext.fly(t).hasCls("x-imagecommand-disabled")) {
                return;
            }
            
            var row = e.getTarget(".x-grid-row");
            
            if (row === false) {
                return;
            }
            
            if (this !== this.grid.headerCt.getHeaderAtIndex(cellIndex)) {
                return;
            }

            record = this.grid.store.getAt ? this.grid.store.getAt(recordIndex) : view.getRecord(view.getNode(recordIndex));

            this.fireEvent("command", this, cmd, record, recordIndex, cellIndex);
        }

        t = e.getTarget(".group-row-imagecommand");
        
        if (t) {
            var groupField = this.grid.store.groupField,
                groupId = Ext.fly(t).up('.x-grid-group-hd').dom.nextSibling.id.substr((view.id + '-gp-').length);                

            cmd = Ext.fly(t).getAttributeNS("", "cmd");
            
            if (Ext.isEmpty(cmd, false) || Ext.fly(t).hasCls("x-imagecommand-disabled")) {
                return;
            }

            this.fireEvent("groupcommand", this, cmd, this.grid.store.getGroups(groupId));
        }
    },
    
    renderer : function (value, meta, record, row, col, store) {
        meta.tdCls = meta.tdCls || "";
        meta.tdCls += " row-imagecommand-cell";

        if (this.isHidden()) {
            meta.tdCls += " x-hide-command";
        }

        if (this.commands) {
            var preparedCommands = [],
                i,
                cmd,
                command,
                commands = this.commands;

            for (i = 0; i < commands.length; i++) {
                cmd = commands[i];                

                if (cmd.iconCls && cmd.iconCls.charAt(0) === '#') {
                    cmd.iconCls = X.net.RM.getIcon(cmd.iconCls.substring(1));
                }
            }
            
            if (this.prepareCommands) {                
                commands = Ext.net.clone(this.commands);
                this.prepareCommands(this.grid, commands, record, row);
            }            
            
            for (i = 0; i < commands.length; i++) {
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
                
                if (this.prepareCommand) {
                    this.prepareCommand(this.grid, command, record, row);
                }

                if (command.iconCls && command.iconCls.charAt(0) === '#') {
                    command.iconCls = X.net.RM.getIcon(command.iconCls.substring(1));
                }

                if (command.disabled) {
                    command.cls = (command.cls || "") + " x-imagecommand-disabled";
                }

                if (command.hidden) {
                    var hideMode = command.hideMode || "display";
                    command.hideCls = "x-hide-" + hideMode;
                }
                
                if (Ext.isIE6 && Ext.isEmpty(cmd.text, false)) {
                    command.noTextCls = "no-row-imagecommand-text";
                }

                preparedCommands.push(command);
            }
            
            return this.getRowTemplate().apply({ commands : preparedCommands });
        }
        return "";
    },
    
    commandTemplate :
		'<div class="row-imagecommands">' +
		  '<tpl for="commands">' +
		     '<div cmd="{command}" class="row-imagecommand {cls} {noTextCls} {iconCls} {hideCls}" ' +
		     'style="{style}" data-qtip="{qtext}" data-qtitle="{qtitle}">' +
		        '<tpl if="text"><span data-qtip="{qtext}" data-qtitle="{qtitle}">{text}</span></tpl>' +
		     '</div>' +
		  '</tpl>' +
		'</div>',
		
    groupCommandTemplate :
		 '<tpl for="commands">' +
		    '<div cmd="{command}" class="group-row-imagecommand {cls} {iconCls} {hideCls} {align}" ' +
		      'style="{style}" data-qtip="{qtext}" data-qtitle="{qtitle}"><tpl if="text"><span data-qtip="{qtext}" data-qtitle="{qtitle}">{text}</span></tpl></div>' +
		 '</tpl>',
    
    getRowTemplate : function () {
        if (Ext.isEmpty(this.rowTemplate)) {
            this.rowTemplate = new Ext.XTemplate(this.commandTemplate);
        }

        return this.rowTemplate;
    }
});