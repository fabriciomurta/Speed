Ext.define('Ext.patch.EXTJS16166', { // #657
    override: 'Ext.view.View',
    compatibility: '5.1.0.107',
    handleEvent: function(e) {
        var me = this,
            isKeyEvent = me.keyEventRe.test(e.type),
            nm = me.getNavigationModel();

        e.view = me;
        
        if (isKeyEvent) {
            e.item = nm.getItem();
            e.record = nm.getRecord();
        }

        // If the key event was fired programatically, it will not have triggered the focus
        // so the NavigationModel will not have this information.
        if (!e.item) {
            e.item = e.getTarget(me.itemSelector);
        }
        if (e.item && !e.record) {
            e.record = me.getRecord(e.item);
        }

        if (me.processUIEvent(e) !== false) {
            me.processSpecialEvent(e);
        }
        
        // We need to prevent default action on navigation keys
        // that can cause View element scroll unless the event is from an input field.
        // We MUST prevent browser's default action on SPACE which is to focus the event's target element.
        // Focusing causes the browser to attempt to scroll the element into view.
        
        if (isKeyEvent && !Ext.fly(e.target).isInputField()) {
            if (e.getKey() === e.SPACE || e.isNavKeyPress(true)) {
                e.preventDefault();
            }
        }
    }
});

Ext.view.View.override({
    initComponent : function () {
         this.plugins = this.plugins || [];
         this.plugins.push(Ext.create('Ext.view.plugin.SelectionSubmit', {}));

         this.callParent(arguments);
    },

    getRowsValues : function (config) {
        if (Ext.isBoolean(config)) {
            config = {selectedOnly: config};
        }
        
        config = config || {};

        var records = (config.selectedOnly === true ? this.getSelectionModel().getSelection() : this.store.getRange()) || [],
            record,
            values = [],
            dataR,
            idProp,
            i;

        for (i = 0; i < records.length; i++) {
            record = records[i];
            if (Ext.isEmpty(records[i])) {
                continue;
            }

            idProp = record.self.idField.name;
            
            dataR = Ext.apply({}, record.data);

            if (idProp && dataR.hasOwnProperty(idProp)) {
                dataR[idProp] = record.getId();
            }
            
            dataR = this.store.prepareRecord(dataR, record, config);

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },

    submitData : function (config) {
        this.store._submit(this.getRowsValues(config));
    },

    handleEvent: function (e) {
        var me = this,
            item = e.getTarget();

        if (me.isDestroyed || Ext.fly(item).parent("." + me.baseCls) == me.el) {
            return this.callParent(arguments);
        }
    },

    handleMouseOver: function (e) {
        var me = this,
            item = e.getTarget();

        if (me.isDestroyed || Ext.fly(item).parent("." + me.baseCls) == me.el) {
            return this.callParent(arguments);
        }
    }
});