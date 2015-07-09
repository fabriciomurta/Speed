
// @source selection/RowModel.js

Ext.selection.RowModel.override({
    getCurrentPosition: function(view) {
        var firstSelection = this.selected.items[0];
        if (firstSelection) {
            return new Ext.grid.CellContext(view || this.view).setPosition(this.store.indexOf(firstSelection), 0);
        }
    },

    // The GitHub issue #485
    onEditorTab: function (editingPlugin, e) {
        var me = this,
            view = editingPlugin.context.view, // fix
            record = editingPlugin.getActiveRecord(),
            header = editingPlugin.getActiveColumn(),
            position = view.getPosition(record, header),
            direction = e.shiftKey ? 'left' : 'right';

        do {
            position = view.walkCells(position, direction, e, me.preventWrap);
        } while (position && (!position.columnHeader.getEditor(record) || !editingPlugin.startEditByPosition(position)));
    }
});