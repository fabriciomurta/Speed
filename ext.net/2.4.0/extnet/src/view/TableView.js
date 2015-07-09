
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
    hasActiveGrouping: function(){
        return this.isGrouping && this.store.isGrouped();
    },

    getRecord: function(node) {
        var me = this,
            record,
            recordIndex;

        // If store.destroyStore has been called before some delayed event fires on a node, we must ignore the event.
        if (me.store.isDestroyed) {
            return;
        }

        node = me.getNode(node);
        if (node) {
            // If we're grouping, the indexes may be off
            // because of collapsed groups, so just grab it by id
            if (!me.hasActiveGrouping()) {
                recordIndex = node.getAttribute('data-recordIndex');
                if (recordIndex) {
                    recordIndex = parseInt(recordIndex, 10);
                    if (recordIndex > -1) {
                        // The index is the index in the original Store, not in a GroupStore
                        // The Grouping Feature increments the index to skip over unrendered records in collapsed groups
                        return me.store.data.getAt(recordIndex);
                    }
                }
            }
            record = me.store.getByInternalId(node.getAttribute('data-recordId'));

            if (!record) {
                record = this.dataSource.data.get(node.getAttribute('data-recordId'));
            }

            return record;
        }
    },

    indexInStore: function(node) {
        node = node.isCollapsedPlaceholder ? this.getNode(node) : this.getNode(node, false);
        if (!node && node !== 0) {
            return -1;
        }
        var recordIndex = node.getAttribute('data-recordIndex');
        if (recordIndex) {
            return parseInt(recordIndex, 10);
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
    },
    // end of the temporary fix for the github issue #276

    // The github issue #369. Remove after update to the next ExtJS after 4.2.1
    renderRow: function (record, rowIdx, out) {
        var me = this,
            isMetadataRecord = rowIdx === -1,
            selModel = me.selModel,
            rowValues = me.rowValues,
            itemClasses = rowValues.itemClasses,
            rowClasses = rowValues.rowClasses,
            cls,
            rowTpl = me.rowTpl;
 
        // Set up mandatory properties on rowValues
        rowValues.record = record;
        rowValues.recordId = record.internalId;
        rowValues.recordIndex = rowIdx;
        rowValues.rowId = me.getRowId(record);
        rowValues.itemCls = rowValues.rowCls = '';

        if (!rowValues.columns) {
            rowValues.columns = me.ownerCt.columnManager.getColumns();
        }
 
        itemClasses.length = rowClasses.length = 0;
 
        // If it's a metadata record such as a summary record.
        // So do not decorate it with the regular CSS.
        // The Feature which renders it must know how to decorate it.
        if (!isMetadataRecord) {
            itemClasses[0] = Ext.baseCSSPrefix + "grid-row";

            if (selModel && selModel.isRowSelected) {
                //if (selModel.isRowSelected(rowIdx + 1)) { // wrong
                if (selModel.isRowSelected(record)) { // fix
                    itemClasses.push(me.beforeSelectedItemCls);
                }

                if (selModel.isRowSelected(record)) {
                    itemClasses.push(me.selectedItemCls);
                }
            }
 
            if (me.stripeRows && rowIdx % 2 !== 0) {
                rowClasses.push(me.altRowCls);
            }
 
            if (me.getRowClass) {
                cls = me.getRowClass(record, rowIdx, null, me.dataSource);

                if (cls) {
                    rowClasses.push(cls);
                }
            }
        }
         
        if (out) {
            rowTpl.applyOut(rowValues, out);
        } else {
            return rowTpl.apply(rowValues);
        }
    }
    // end of the fix for the github issue #369
});