
// @source core/form/FormPanel.js

Ext.form.Panel.override({    
    initComponent : function () {
        this.callParent(arguments);
        this.addEvents("fieldchange");
    },    

    validate : function () {
        return this.getForm().isValid();
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