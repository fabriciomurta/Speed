Ext.toolbar.Breadcrumb.override({
    applySelection: function (node) {
        if (node !== 'root' && Ext.isString(node)) {
            var store = this.getStore();

            if (store) {
                node = store.getNodeById(node);
            }
        }
        return this.callParent([node]);
    },

    updateSelection: function (node) {
        this.callParent(arguments);
        if (this.hasId()) {
            this.getSelectionField().setValue(node ? node.getId() : "");
        }
    },

    getSelectionField: function () {
        if (!this.selectionField && this.hasId()) {
            var value = this.getSelection();
            if (value && value.isModel) {
                value = value.getId();
            }
            else {
                value = "";
            }

            this.selectionField = new Ext.form.Hidden({
                name: this.id,
                value: value
            });

            this.on("beforedestroy", function () {
                this.destroy();
            }, this.selectionField);

            if (this.hasId()) {
                this.selectionField.render(this.el.parent() || this.el);
            }
        }

        return this.selectionField;
    }
});