Ext.panel.Table.override({     
     processEvent : function (type, view, cell, recordIndex, cellIndex, e) {
        var me = this,
            header;
            
        if (this.ignoreTargets) {
            var i;

            for (i = 0; i < this.ignoreTargets.length; i++) {
                if (e.getTarget(this.ignoreTargets[i])) {
                    return false;
                }
            }
        }

        if (cellIndex !== -1) {
            header = me.headerCt.getGridColumns()[cellIndex];

            return header.processEvent.apply(header, arguments);
        }
    },    

    beforeDestroy : function () {
        if (this.editors) {
            Ext.destroy(this.editors);
        }

        this.callParent(arguments);
    },

    hasLockedColumns : function (columns) {
        var i,
            len = columns ? columns.length : 0,
            column;

        for (i = 0; i < len; i++) {
            column = columns[i];

            if (!column.processed && column.locked) {
                return true;
            }
        }
    }
});