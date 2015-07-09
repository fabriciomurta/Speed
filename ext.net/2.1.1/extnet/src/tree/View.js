Ext.tree.View.override({
    getChecked: function () {
        var checked = [],
            node  = this.node || (this.store && this.store.treeStore && this.store.treeStore.getRootNode());
        if (node) {
            node.cascadeBy(function (rec) {
                if (rec.get('checked')) {
                    checked.push(rec);
                }
            });
        }
        return checked;
    }
});