Ext.grid.plugin.RowEditing.override({
    saveBtnText   : 'Update',
    cancelBtnText : 'Cancel',
    errorsText    : 'Errors',
    dirtyText     : 'You need to commit or cancel your changes', 

    getEditor: function () {
        var me = this;

        if (!me.editor) {
            me.editor = me.initEditor();
            me.editor.on("render", me.setHandlers, me, {single:true});
        }

        return me.editor;
    },

    setHandlers : function () {
        if (this.saveHandler) {
            this.editor.down("#update").handler = this.saveHandler;
        }
    }
});