/**
 * @class Ext.ux.CheckColumn
 * @extends Ext.grid.column.Column
 * <p>A Header subclass which renders a checkbox in each column cell which toggles the truthiness of the associated data field on click.</p>
 * <p><b>Note. As of ExtJS 3.3 this no longer has to be configured as a plugin of the GridPanel.</b></p>
 * <p>Example usage:</p>
 * <pre><code>
// create the grid
var grid = Ext.create('Ext.grid.Panel', {
    ...
    columns: [{
           text: 'Foo',
           ...
        },{
           xtype: 'checkcolumn',
           text: 'Indoor?',
           dataIndex: 'indoor',
           width: 55
        }
    ]
    ...
});
 * </code></pre>
 * In addition to toggling a Boolean value within the record data, this
 * class adds or removes a css class <tt>'x-grid-checked'</tt> on the td
 * based on whether or not it is checked to alter the background image used
 * for a column.
 */
Ext.define('Ext.ux.CheckColumn', {
    extend : 'Ext.grid.column.Column',
    alias  : 'widget.checkcolumn',

    stopSelection: true,
    
    constructor : function () {
        this.addEvents(
            /**
             * @event checkchange
             * Fires when the checked state of a row changes
             * @param {Ext.ux.CheckColumn} this
             * @param {Number} rowIndex The row index
             * @param {Number} record The record
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
    processEvent : function (type, view, cell, recordIndex, cellIndex, e) {
        var me = this,
            key = type === 'keydown' && e.getKey(),
            mousedown = type == 'mousedown';

        if (me.editable && (mousedown || (key == e.ENTER || key == e.SPACE))) {
            var store = view.panel.store,
                record = store.getAt ? store.getAt(recordIndex) : view.getRecord(view.getNode(recordIndex)),
                dataIndex = me.dataIndex,
                checked = !record.get(dataIndex),
                eventTarget = view.panel.editingPlugin || view.panel;
 
            var ev = {
                grid   : view.panel,
                record : record,
                field  : dataIndex,
                value  : record.get(me.dataIndex),
                row    : view.getNode(recordIndex),
                column : me,
                rowIdx : recordIndex,
                colIdx : cellIndex,
                cancel : false
            };
 
            if (eventTarget.fireEvent("beforeedit", eventTarget, ev) === false || ev.cancel === true) {
                return;
            }
 
            ev.originalValue = ev.value;
            ev.value = checked;
 
            if (eventTarget.fireEvent("validateedit", eventTarget, ev) === false || ev.cancel === true) {
                return;
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
            // cancel selection.
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

