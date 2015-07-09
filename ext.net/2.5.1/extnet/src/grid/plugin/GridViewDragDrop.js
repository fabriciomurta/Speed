
// @source grid/plugin/GridViewDragDrop.js

Ext.grid.plugin.DragDrop.override({
    init : function (view) {
        view.on("afterrender", this.onViewRender, this, { single: true }); // TODO: The github issue #178. Review after Sencha fix.
    }
});