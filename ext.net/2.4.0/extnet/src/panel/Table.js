Ext.panel.Table.override({     
     processEvent : function (type, view, cell, recordIndex, cellIndex, e, record, row) {
        var me = this,
            header;
            
        if (this.ignoreTargets) {
            var i;

            for (i = 0; i < this.ignoreTargets.length; i++) {
                if (e.getTarget(this.ignoreTargets[i])) {
                    return false;
                }
            }
        }

        if (cellIndex !== -1) {
            header = me.columnManager.getColumns()[cellIndex];

            return header && header.processEvent.apply(header, arguments);
        }
    },    

    beforeDestroy : function () {
        if (this.editors) {
            Ext.destroy(this.editors);
        }

        this.callParent(arguments);
    },

    hasLockedColumns : function (columns) {
        // In case they specified a config object with items...
        if (Ext.isObject(columns)) {
            columns = columns.items;
        }

        var i,
            len = columns ? columns.length : 0,
            column;

        for (i = 0; i < len; i++) {
            column = columns[i];

            if (!column.processed && column.locked) {
                return true;
            }
        }
    },

    insertColumn : function (index, newCol, doLayout) {
        var headerCt = this.normalGrid ? this.normalGrid.headerCt : this.headerCt; 

        if (index < 0) {
            index = 0;
        }

        if (newCol.locked && this.lockedGrid) {
            headerCt = this.lockedGrid.headerCt; 
        }

        headerCt.insert(index, newCol);

        if (doLayout !== false) {
            this.updateLayout(); 
            this.fireEvent('reconfigure', this); 
            this.getView().refresh();
        } 
    },

    addColumn : function (newCol, doLayout) {
        var headerCt = this.normalGrid ? this.normalGrid.headerCt : this.headerCt; 
        
        if (newCol.locked && this.lockedGrid) {
            headerCt = this.lockedGrid.headerCt; 
        }

        this.insertColumn(headerCt.getColumnCount(), newCol, doLayout);
    },

    removeColumn : function (index, doLayout) {
        var headerCt = this.normalGrid ? this.normalGrid.headerCt : this.headerCt,
            column,
            locked = false; 

        column = headerCt.getComponent(index);

        if(!column && this.lockedGrid) {
            headerCt = this.lockedGrid.headerCt;
            column = headerCt.getComponent(index);            
            locked = true;
        }

        if (column) {
            headerCt.remove(column);            

            if (doLayout !== false) {
                if(locked) {
                    this.syncLockedWidth();
                    this.lockedGrid.getView().refresh();
                }
                
                this.updateLayout(); 
                this.fireEvent('reconfigure', this); 
                this.getView().refresh();
            }
        }
    },

    removeAllColumns : function (doLayout) {
        var headerCt = this.normalGrid ? this.normalGrid.headerCt : this.headerCt;

        headerCt.removeAll();

        if(this.lockedGrid) {
           this.lockedGrid.headerCt.removeAll();
        }

        if (doLayout !== false) {
            this.updateLayout();             
            this.fireEvent('reconfigure', this); 
            this.getView().refresh();
        }
    }
});