// @source src/view/DropZone.js

Ext.view.DropZone.override({
    // Override of the getPosition and positionIndicator methods for the GitHub issue #444
    getPosition: function(e, node) {
        var y      = e.getXY()[1],
            regionEl = Ext.fly(node),
            region,
            pos;
 
        if (regionEl.hasCls("x-grid-wrap-row")) {
            regionEl = regionEl.down("tr.x-grid-data-row");
        }
 
        region = regionEl.getRegion();
 
        if ((region.bottom - y) >= (region.bottom - region.top) / 2) {
            pos = "before";
        } else {
            pos = "after";
        }
 
        return pos;
    },
 
    positionIndicator: function(node, data, e) {
        var me = this,
            view = me.view,
            pos = me.getPosition(e, node),
            overRecord = view.getRecord(node),
            draggingRecords = data.records,
            indicatorY;
 
        if (!Ext.Array.contains(draggingRecords, overRecord) && (
            pos == 'before' && !me.containsRecordAtOffset(draggingRecords, overRecord, -1) ||
            pos == 'after' && !me.containsRecordAtOffset(draggingRecords, overRecord, 1)
        )) {
            me.valid = true;
 
            if (me.overRecord != overRecord || me.currentPosition != pos) {
 
                nodeEl = Ext.fly(node);
 
                if (nodeEl.hasCls("x-grid-wrap-row")) {
                    nodeEl = nodeEl.down("tr.x-grid-data-row");
                }
 
                indicatorY = nodeEl.getY() - view.el.getY() - 1;
                if (pos == 'after') {
                    indicatorY += Ext.fly(nodeEl).getHeight();
                }
 
                         
                me.getIndicator().setWidth(Ext.fly(view.el).getWidth()).showAt(0, indicatorY);
 
                // Cache the overRecord and the 'before' or 'after' indicator.
                me.overRecord = overRecord;
                me.currentPosition = pos;
            }
        } else {
            me.invalidateDrop();
        }
    }
});