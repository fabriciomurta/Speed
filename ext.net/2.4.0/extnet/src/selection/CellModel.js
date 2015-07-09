Ext.selection.CellModel.override({
    deselectAll: function (suppressEvent) {
        this.setCurrentPosition();
    }
});