Ext.view.View.override({
    initComponent : Ext.Function.createInterceptor(Ext.view.View.prototype.initComponent, function () {
         this.plugins = this.plugins || [];
         this.plugins.push(Ext.create('Ext.view.plugin.SelectionSubmit', {}));     
    }),

    getRowsValues : function (config) {
        if (Ext.isBoolean(config)) {
            config = {selectedOnly: config};
        }
        
        config = config || {};

        var records = (config.selectedOnly === true ? this.getSelectionModel().getSelection() : this.store.getRange()) || [],
            values = [],
            dataR,
            idProp = this.store.proxy.reader.getIdProperty(),
            i;

        for (i = 0; i < records.length; i++) {
            if (Ext.isEmpty(records[i])) {
                continue;
            }
            
            dataR = Ext.apply({}, records[i].data);

            if (idProp && dataR.hasOwnProperty(idProp)) {
                dataR[idProp] = records[i].getId();
            }
            
            dataR = this.store.prepareRecord(dataR, records[i], config);

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },

    submitData : function (config) {
        this.store._submit(this.getRowsValues(config));
    },

    handleMouseOverOrOut: function(e) {
        var me = this,
            isMouseout = e.type === 'mouseout',
            method = isMouseout ? e.getRelatedTarget : e.getTarget,
            nowOverItem = method.call(e, me.itemSelector) || method.call(e, me.dataRowSelector);

        // If the mouse event of whatever type tells use that we are no longer over the current mouseOverItem...
        if (!me.mouseOverItem || nowOverItem !== me.mouseOverItem) {

            // First fire mouseleave for the item we just left (If it is in this view)
            if (me.el.contains(me.mouseOverItem)) {
                if (me.mouseOverItem) {
                    e.item = me.mouseOverItem;
                    e.newType = 'mouseleave';
                    me.handleEvent(e);
                }
            }

            // If we are over an item *in this view*, fire the mouseenter
            if (me.el.contains(nowOverItem)) {
                me.mouseOverItem = nowOverItem;
                if (me.mouseOverItem) {
                    e.item = me.mouseOverItem;
                    e.newType = 'mouseenter';
                    me.handleEvent(e);
                }
            }
        }
    }
});