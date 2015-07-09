/**
 * @class Ext.ux.CheckColumn
 * @extends Ext.grid.column.Column
 * A Header subclass which renders a checkbox in each column cell which toggles the truthiness of the associated data field on click.
 *
 * Example usage:
 * 
 *    // create the grid
 *    var grid = Ext.create('Ext.grid.Panel', {
 *        ...
 *        columns: [{
 *           text: 'Foo',
 *           ...
 *        },{
 *           xtype: 'checkcolumn',
 *           text: 'Indoor?',
 *           dataIndex: 'indoor',
 *           width: 55
 *        }]
 *        ...
 *    });
 *
 * In addition to toggling a Boolean value within the record data, this
 * class adds or removes a css class <tt>'x-grid-checked'</tt> on the td
 * based on whether or not it is checked to alter the background image used
 * for a column.
 */
Ext.define('Ext.ux.CheckColumn', {
    extend : 'Ext.grid.column.Column',
    alias  : 'widget.checkcolumn',

    /**
     * @cfg {Boolean} [stopSelection=true]
     * Prevent grid selection upon mousedown.
     */
    stopSelection : true,

    tdCls : Ext.baseCSSPrefix + 'grid-cell-checkcolumn',

    constructor : function () {
        this.addEvents(
            /**
             * @event beforecheckchange
             * Fires when before checked state of a row changes.
             * The change may be vetoed by returning `false` from a listener.
             * @param {Ext.ux.CheckColumn} this CheckColumn
             * @param {Number} rowIndex The row index
             * @param {Ext.data.Model} record The record
             * @param {Boolean} checked True if the box is to be checked
             */
            'beforecheckchange',
            /**
             * @event checkchange
             * Fires when the checked state of a row changes
             * @param {Ext.ux.CheckColumn} this
             * @param {Number} rowIndex The row index
             * @param {Ext.data.Model} record The record
             * @param {Boolean} checked True if the box is checked
             */
            'checkchange'
        );
        this.callParent(arguments);
    },

    /**
     * @private
     * Process and refire events routed from the GridView's processEvent method.
     */
    processEvent : function (type, view, cell, recordIndex, cellIndex, e, record, row) {
        var me = this,
            key = type === 'keydown' && e.getKey(),
            mousedown = type == 'mousedown';

        if (me.editable && (mousedown || (key == e.ENTER || key == e.SPACE))) {
            var store = view.panel.store,                
                dataIndex = me.dataIndex,
                checked = !record.get(dataIndex),
                eventTarget = view.panel.editingPlugin || view.panel;
 
            var ev = {
                grid   : view.panel,
                record : record,
                field  : dataIndex,
                value  : record.get(me.dataIndex),
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

                    if (value != record.get(dataIndex)) {
                        record.set(dataIndex, value);
                    }
                });
                store.resumeEvents();
                store.fireEvent("datachanged", store);
            } else {
                record.set(dataIndex, checked);
            }
 
            me.fireEvent('checkchange', me, recordIndex, record, checked);
            eventTarget.fireEvent('edit', eventTarget, ev);
            
            // Mousedown on the now nonexistent cell causes the view to blur, so stop it continuing.       
            if (mousedown) {
                //e.stopEvent();
                var browserEvent = e.browserEvent;

                if (browserEvent) {                    
                    Ext.EventManager.stopPropagation(browserEvent);
                }

                e.preventDefault();
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
            return me.callParent(arguments);
        }
    },

    // Note: class names are not placed on the prototype bc renderer scope
    // is not in the header.
    renderer : function (value) {
        var cssPrefix = Ext.baseCSSPrefix,
            cls = [cssPrefix + 'grid-checkheader'];

        if (value) {
            cls.push(cssPrefix + 'grid-checkheader-checked');
        }

        return '<div class="' + cls.join(' ') + '">&#160;</div>';
    }
});

