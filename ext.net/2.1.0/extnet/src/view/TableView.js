
Ext.view.Table.override({     
    onUpdate : Ext.Function.createInterceptor(Ext.view.Table.prototype.onUpdate, function (store, record, operation, changedFieldNames) {
           var me = this,
               index = store.indexOf(record);
            
           me.fireEvent('beforeitemupdate', me, record, index);
    }),

    processUIEvent: function (e) {
        if (this.stopEventFn && this.stopEventFn(this, e) === false) {
            return false;
        }
        
        this.callParent(arguments);
    },

    moveColumn: function (fromIdx, toIdx, colsToMove) {
        var me = this,
            fragment = (colsToMove > 1) ? document.createDocumentFragment() : undefined,
            destinationCellIdx = toIdx,
            colCount = me.getGridColumns().length,
            lastIdx = colCount - 1,
            doFirstLastClasses = (me.firstCls || me.lastCls) && (toIdx === 0 || toIdx == colCount || fromIdx === 0 || fromIdx == lastIdx),
            i,
            j,
            rows, len, tr, headerRows;

        if (me.rendered) {
            // Use select here. In most cases there will only be one row. In
            // the case of a grouping grid, each group also has a header.
            headerRows = me.el.query(me.headerRowSelector);
            rows = me.el.query(me.rowSelector);

            if (me.panel && me.panel.getRowExpander && me.panel.getRowExpander()) {
                headerRows = Ext.Array.filter(headerRows, function (item) {
                    return !Ext.fly(item).findParent("div.x-grid-rowbody", me.el);
                });

                rows = Ext.Array.filter(rows, function (item) {
                    return !Ext.fly(item).findParent("div.x-grid-rowbody", me.el);
                });
            }

            if (toIdx > fromIdx && fragment) {
                destinationCellIdx -= colsToMove;
            }

            // Move the column sizing header to match
            for (i = 0, len = headerRows.length; i < len; ++i) {
                tr = headerRows[i];
                if (fragment) {
                    for (j = 0; j < colsToMove; j++) {
                        fragment.appendChild(tr.cells[fromIdx]);
                    }
                    tr.insertBefore(fragment, tr.cells[destinationCellIdx] || null);
                } else {
                    tr.insertBefore(tr.cells[fromIdx], tr.cells[destinationCellIdx] || null);
                }
            }

            for (i = 0, len = rows.length; i < len; i++) {
                tr = rows[i];

                // Keep first cell class and last cell class correct *only if needed*
                if (doFirstLastClasses) {

                    if (fromIdx === 0) {
                        Ext.fly(tr.cells[0]).removeCls(me.firstCls);
                        Ext.fly(tr.cells[1]).addCls(me.firstCls);
                    } else if (fromIdx === lastIdx) {
                        Ext.fly(tr.cells[lastIdx]).removeCls(me.lastCls);
                        Ext.fly(tr.cells[lastIdx - 1]).addCls(me.lastCls);
                    }
                    if (toIdx === 0) {
                        Ext.fly(tr.cells[0]).removeCls(me.firstCls);
                        Ext.fly(tr.cells[fromIdx]).addCls(me.firstCls);
                    } else if (toIdx === colCount) {
                        Ext.fly(tr.cells[lastIdx]).removeCls(me.lastCls);
                        Ext.fly(tr.cells[fromIdx]).addCls(me.lastCls);
                    }
                }

                if (fragment) {
                    for (j = 0; j < colsToMove; j++) {
                        fragment.appendChild(tr.cells[fromIdx]);
                    }
                    tr.insertBefore(fragment, tr.cells[destinationCellIdx] || null);
                } else {
                    tr.insertBefore(tr.cells[fromIdx], tr.cells[destinationCellIdx] || null);
                }
            }
            me.setNewTemplate();
        }
    }
});