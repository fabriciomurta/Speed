
Ext.view.Table.override({     
    onUpdate : Ext.Function.createInterceptor(Ext.view.Table.prototype.onUpdate, function (store, record, operation, changedFieldNames) {
           var me = this,
               index;

           if (store.indexOf) {
                index = store.indexOf(record);
            }
            else if (record.parentNode) {
                index = record.parentNode.indexOf(record);
            }
            
           me.fireEvent('beforeitemupdate', me, record, index);
    }),

    processUIEvent: function (e) {
        if (this.stopEventFn && this.stopEventFn(this, e) === false) {
            return false;
        }
        
        return this.callParent(arguments);
    },

    moveColumn: function(fromIdx, toIdx, colsToMove) {
        var me = this,
            fragment = (colsToMove > 1) ? document.createDocumentFragment() : undefined,
            destinationCellIdx = toIdx,
            colCount = me.getGridColumns().length,
            lastIndex = colCount - 1,
            doFirstLastClasses = (me.firstCls || me.lastCls) && (toIdx === 0 || toIdx == colCount || fromIdx === 0 || fromIdx == lastIndex),
            i,
            j,
            rows, len, tr, cells,
            tables;

        // Dragging between locked and unlocked side first refreshes the view, and calls onHeaderMoved with
        // fromIndex and toIndex the same.
        if (me.rendered && toIdx !== fromIdx) {
            // Grab all rows which have column cells in.
            // That is data rows and column sizing rows.
            rows = me.el.query(me.getDataRowSelector());

            if (me.panel && me.panel.getRowExpander && me.panel.getRowExpander()) {             
                rows = Ext.Array.filter(rows, function (item) {
                    return !Ext.fly(item).findParent("div.x-grid-rowbody", me.el);
                });
            }

            if (toIdx > fromIdx && fragment) {
                destinationCellIdx -= colsToMove;
            }

            for (i = 0, len = rows.length; i < len; i++) {
                tr = rows[i];
                cells = tr.childNodes;

                // Keep first cell class and last cell class correct *only if needed*
                if (doFirstLastClasses) {

                    if (cells.length === 1) {
                        Ext.fly(cells[0]).addCls(me.firstCls);
                        Ext.fly(cells[0]).addCls(me.lastCls);
                        continue;
                    }
                    if (fromIdx === 0) {
                        Ext.fly(cells[0]).removeCls(me.firstCls);
                        Ext.fly(cells[1]).addCls(me.firstCls);
                    } else if (fromIdx === lastIndex) {
                        Ext.fly(cells[lastIndex]).removeCls(me.lastCls);
                        Ext.fly(cells[lastIndex - 1]).addCls(me.lastCls);
                    }
                    if (toIdx === 0) {
                        Ext.fly(cells[0]).removeCls(me.firstCls);
                        Ext.fly(cells[fromIdx]).addCls(me.firstCls);
                    } else if (toIdx === colCount) {
                        Ext.fly(cells[lastIndex]).removeCls(me.lastCls);
                        Ext.fly(cells[fromIdx]).addCls(me.lastCls);
                    }
                }

                if (fragment) {
                    for (j = 0; j < colsToMove; j++) {
                        fragment.appendChild(cells[fromIdx]);
                    }
                    tr.insertBefore(fragment, cells[destinationCellIdx] || null);
                } else {
                    tr.insertBefore(cells[fromIdx], cells[destinationCellIdx] || null);
                }
            }

            // Shuffle the <colgroup> elements at the ta=op of all <tables> in the grid
            tables = me.el.query(me.getBodySelector());
            for (i = 0, len = tables.length; i < len; i++) {
                tr = tables[i];
                if (fragment) {
                    for (j = 0; j < colsToMove; j++) {
                        fragment.appendChild(tr.childNodes[fromIdx]);
                    }
                    tr.insertBefore(fragment, tr.childNodes[destinationCellIdx] || null);
                } else {
                    tr.insertBefore(tr.childNodes[fromIdx], tr.childNodes[destinationCellIdx] || null);
                }
            }
        }
    },

    getFeature: function(id) {
        var f = this.callParent(arguments);

        if (!f) {
            var features = this.featuresMC;
            if (features) {
                return features.getAt(features.findIndex("proxyId", id));
            }
        }

        return f;
    },

    // ----- remove in the next release (start) ---- The github issue #264.
    getRecord: function (node) {
        if (this.dataSource.buffered) {
            return this.callParent(arguments);
        }

        var record;

        node = this.getNode(node);
        if (node) {
            record = this.dataSource.data.get(node.getAttribute('data-recordId'));
        }

        if (!record) {
            record = this.callParent(arguments);
        }

        return record;
    },

    indexInStore: function (node) {
        if (this.dataSource.buffered) {
            return this.callParent(arguments);
        }

        node = this.getNode(node, true);
        if (!node && node !== 0) {
            return -1;
        }

        return this.dataSource.indexOf(this.getRecord(node));
    },

    // ----- remove in the next release (end) ----

    // The github issue #276. Remove after Sencha fix.

    getRowStyleTableElOriginal: Ext.view.Table.prototype.getRowStyleTableEl,

    getRowStyleTableEl: function () {
        var el = this.getRowStyleTableElOriginal.apply(this, arguments);
        if (!el) {
            el = {
                addCls: Ext.emptyFn,
                removeCls: Ext.emptyFn,
                tagName: {}
            }
        }
        return el;
    }

    // end of the temporary fix for the github issue #276

});