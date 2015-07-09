Ext.view.TableLayout.override({    
    setColumnWidths: function(ownerContext) {
        var me = this,
            owner = me.owner,
            context = ownerContext.context,
            columns = me.headerCt.getVisibleGridColumns(),
            column,
            i = 0, len = columns.length,
            tableWidth = 0,
            columnLineWidth = 0,
            childContext,
            colWidth,
            isContentBox = !Ext.isBorderBox;

        // So that the setProp can trigger this layout.
        if (context) {
            context.currentLayout = me;
        }

        // Set column width corresponding to each header
        for (i = 0; i < len; i++) {
            column = columns[i];
            childContext = context.getCmp(column);
            colWidth = childContext.props.width;
            if (isNaN(colWidth)) {
                // We don't have a width set, so we need to trigger when this child
                // actually gets a width assigned so we can continue. Technically this
                // shouldn't happen however we have a bug inside ColumnLayout where
                // columnWidthsDone is set incorrectly. This is just a workaround.
                childContext.getProp('width');
                return false;
            }
            tableWidth += colWidth;
            // https://sencha.jira.com/browse/EXTJSIV-9263 - Browsers which cannot be switched to border box when doctype present (IE6 & IE7) - must subtract borders width from width of cells.
            if (isContentBox && owner.columnLines) {
                // https://sencha.jira.com/browse/EXTJSIV-9744 - default border width to 1 because
                // We are looking at the *header* border widths and Neptune, being a borderless theme
                // omits the border from the last column *HEADER*. But we are interrogating that to
                // know the width of border lines between cells which are not omitted.
                if (!columnLineWidth) {
                    columnLineWidth = context.getCmp(column).borderInfo.width || 1;
                }
                colWidth -= columnLineWidth;
            }

            // Select column sizing <col> elements within every <table> within the grid.
            // 90% of the time, there will be only one table.
            // The RowWrap and Summary Features embed tables within colspanning cells, and these also
            // get <colgroup><col></colgroup> sizers which need updating.
            // On IE8, sizing <col> elements to control column width was about 2.25 times
            // faster than selecting all the cells in the column to be resized.
            // Column sizing using dynamic CSS rules is *extremely* expensive on IE.
            owner.body.select(owner.getColumnSizerSelector(column)).setWidth(colWidth);
        }        

        if (me.owner.panel && me.owner.panel.getRowExpander && me.owner.panel.getRowExpander()) {
             owner.el.select(owner.getBodySelector()).filter(function (tableEl) {
                return !tableEl.findParent("div.x-grid-rowbody", owner.el);
            }).setWidth(tableWidth);
        }
        else {
            owner.el.select(owner.getBodySelector()).setWidth(tableWidth);
        }

        return true;
    }
});