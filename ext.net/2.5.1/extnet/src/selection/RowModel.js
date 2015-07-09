
// @source selection/RowModel.js

Ext.selection.RowModel.override({
    getCurrentPosition: function(view) {
        var firstSelection = this.selected.items[0];
        if (firstSelection) {
            return new Ext.grid.CellContext(view || this.view).setPosition(this.store.indexOf(firstSelection), 0);
        }
    }
});