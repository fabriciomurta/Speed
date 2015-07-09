Ext.grid.header.Container.override({
    // remove it in 4.1.3
    getGridColumns : function (refreshCache) {
        var me = this,
            result = refreshCache ? null : me.gridDataColumns;

        
        if (!result) {
            me.gridDataColumns = result = [];
            me.cascade(function (c) {
                if ((c !== me) && !c.isGroupHeader && c.isHeader) {
                    result.push(c);
                }
            });
        }

        return result;
    }
});