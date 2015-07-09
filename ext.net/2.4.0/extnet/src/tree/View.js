Ext.tree.View.override({
    getChecked: function () {
        var checked = [],
            node  = this.node || (this.getTreeStore().getRootNode());
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