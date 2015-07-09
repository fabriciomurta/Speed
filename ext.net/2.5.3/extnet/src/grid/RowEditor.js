Ext.grid.RowEditor.override({
    // Fix for the github issue #267 (see the "added" comment). Remove after Sencha fix.
    addFieldsForColumn: function (column, initial) {
        var me = this,
            i,
            length, field;

        if (Ext.isArray(column)) {
            for (i = 0, length = column.length; i < length; i++) {
                me.addFieldsForColumn(column[i], initial);
            }
            return;
        }

        if (column.getEditor) {

            // Get a default display field if necessary
            field = column.getEditor(null, {
                xtype: 'displayfield',
                // Override Field's implementation so that the default display fields will not return values. This is done because
                // the display field will pick up column renderers from the grid.
                getModelData: function () {
                    return null;
                }
            });
            if (column.align === 'right') {
                field.fieldStyle = 'text-align:right';
            }

            if (column.xtype === 'actioncolumn') {
                field.fieldCls += ' ' + Ext.baseCSSPrefix + 'form-action-col-field'
            }

            if (me.isVisible() && me.context) {
                if (field.is('displayfield')) {
                    me.renderColumnData(field, me.context.record, column);
                } else {
                    field.suspendEvents();
                    field.setValue(me.context.record.get(column.dataIndex));
                    field.resumeEvents();
                }
            }
            if (column.hidden) {
                me.onColumnHide(column);
            } else if (column.rendered && !initial) {
                // Setting after initial render
                me.onColumnShow(column);
            }

            me.mon(field, 'change', me.onFieldChange, me); // added
        }
    },

    // The GitHub issue #576
    startEdit: function (record, columnHeader) {
        var me = this,
            editingPlugin = me.editingPlugin,
            grid = editingPlugin.grid,
            context = me.context = editingPlugin.context;

        if (!me.rendered) {
            me.width = me.getClientWidth();
            me.render(grid.el, grid.el.dom.firstChild);
            me.getFloatingButtons().render(me.el);
            me.onViewScroll();
        } else {
            me.syncFieldsHorizontalScroll();
        }

        context.grid.getSelectionModel().select(record);

        if (me.isVisible()) {
            me.reposition(true);
        } else {
            me.show();
        }

        me.onGridResize();
        me.loadRecord(record);
    }
});