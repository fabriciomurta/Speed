
// @source core/form/FormPanel.js

Ext.form.Panel.override({    
    initComponent : function () {
        this.callParent(arguments);
        this.addEvents("fieldchange");
    },

    onFieldAdded: function (field) {
        var me = this;
        me.mon(field, 'change', me.fireFieldChange, me);
        me.callParent(arguments);
    }, 

    onFieldRemoved: function (field) {
        var me = this;
        me.mun(field, 'change', me.fireFieldChange, me);
        me.callParent(arguments);
    },

    fireFieldChange: function (field, newValue, oldValue) {
        var me = this;
        me.fireEvent('fieldchange', me, field, newValue, oldValue);
    }, 

    createForm: function () {
        return new Ext.form.Basic(this, Ext.applyIf({listeners: {}, directEvents: {}, messageBusListeners : {}, messageBusDirectEvents : {}}, this.initialConfig));
    },

    isValid : function () {
        return this.getForm().isValid();
    },
    
    validate : function () {
        return this.getForm().isValid();
    },
    
    isDirty : function () {
        return this.getForm().isDirty();
    },
    
    getName : function () {
        return this.id || '';
    },
    
    clearInvalid : function () {
        return this.getForm().clearInvalid();
    },
    
    markInvalid : function (msg) {
        return this.getForm().markInvalid(msg);
    },
    
    getValue : function () {
        return this.getForm().getValues();
    },
    
    setValue : function (value) {
        return this.getForm().setValues(value);
    },
    
    reset : function () {
        return this.getForm().reset();
    }
});