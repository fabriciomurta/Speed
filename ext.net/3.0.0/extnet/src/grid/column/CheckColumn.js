Ext.define('Ext.ux.CheckColumn', {
    override: 'Ext.grid.column.Check',

    processEvent : function (type, view, cell, recordIndex, cellIndex, e, record, row) {
        var me = this,
            key = type === 'keydown' && e.getKey(),
            mousedown = type == 'mousedown';

        if (!me.disabled && !!me.editable && (mousedown || (key == e.ENTER || key == e.SPACE))) {
            var store = view.panel.store,                
                dataIndex = me.dataIndex,
                checked = !me.isRecordChecked(record),
                eventTarget = view.panel.editingPlugin || view.panel;
 
            var ev = {
                grid   : view.panel,
                record : record,
                field  : dataIndex,
                value: !checked,
                row    : row,
                column : me,
                rowIdx : recordIndex,
                colIdx : cellIndex,
                cancel : false
            };
            
            // Allow apps to hook beforecheckchange, beforeedit
            if (me.fireEvent('beforecheckchange', me, recordIndex, record, checked) === false
	            || eventTarget.fireEvent("beforeedit", eventTarget, ev) === false 
		        || ev.cancel === true) {
                // Prevent the view from propagating the event to the selection model if configured to do so.
                return !me.stopSelection;
            }
 
            ev.originalValue = ev.value;
            ev.value = checked;
 
            if (eventTarget.fireEvent("validateedit", eventTarget, ev) === false || ev.cancel === true) {
                // Prevent the view from propagating the event to the selection model if configured to do so.
                return !me.stopSelection;
            }
 
            if (me.singleSelect) {
                store.suspendEvents();
                store.each(function (record, i) {
                    var value = (i == recordIndex);

                    if (value != me.isRecordChecked(record)) {
                        record.set(dataIndex, value);
                    }
                });
                store.resumeEvents();
                store.fireEvent("datachanged", store);
            } else {
                me.setRecordCheck(record, checked, cell, row, e);  
            }
 
            me.fireEvent('checkchange', me, recordIndex, record, checked);
            eventTarget.fireEvent('edit', eventTarget, ev);
            
            // Mousedown on the now nonexistent cell causes the view to blur, so stop it continuing.       
            if (mousedown) {
                e.stopEvent();                
            }
 
            // Selection will not proceed after this because of the DOM update caused by the record modification
            // Invoke the SelectionModel unless configured not to do so
            if (!me.stopSelection) {
                view.selModel.selectByPosition({
                    row    : recordIndex,
                    column : cellIndex
                });
            }
            // Prevent the view from propagating the event to the selection model - we have done that job.
            return false;
        } else {
            return Ext.grid.column.Check.superclass.processEvent.apply(me, arguments);
        }
    }
});

