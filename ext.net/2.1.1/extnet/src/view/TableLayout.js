Ext.view.TableLayout.override({
    flush: function () {
        var me = this,
            context = me.ownerContext.context,
            columns = me.headerCt.getGridColumns(),
            i = 0, len = columns.length,
            el = me.owner.el,
            tableWidth = 0,
            colWidth;

        // So that the setProp can trigger this layout.
        context.currentLayout = me;

        // Set column width corresponding to each header
        for (i = 0; i < len; i++) {
            colWidth = columns[i].hidden ? 0 : context.getCmp(columns[i]).props.width;
            tableWidth += colWidth;

            // Grab the col and set the width.
            // CSS class is generated in TableChunker.
            // Select composites because there may be several chunks.
            el.select(me.getColumnSelector(columns[i])).setWidth(colWidth);
        }
        if (me.owner.panel && me.owner.panel.getRowExpander && me.owner.panel.getRowExpander()) {
            el.select('table.' + Ext.baseCSSPrefix + 'grid-table-resizer').filter(function (tableEl) {
                return !tableEl.findParent("div.x-grid-rowbody", el);
            }).setWidth(tableWidth);
        }
        else {
            el.select('table.' + Ext.baseCSSPrefix + 'grid-table-resizer').setWidth(tableWidth);
        }

        // Now we can measure contentHeight if necessary (if we are height shrinkwrapped)
        me.ownerContext.setProp('columnWidthsFlushed', true);
    }
});