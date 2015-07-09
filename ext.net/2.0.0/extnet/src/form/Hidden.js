
// @source core/form/Hidden.js
Ext.form.field.Hidden.override({
    autoEl : {
        tag  : "input",
        type : "hidden"
    },

    getElConfig : function () {
        return Ext.apply(this.callParent(), {
            id    : this.id,
            name  : this.name || this.getInputId(),
            value : this.getRawValue(),
            cls: Ext.baseCSSPrefix + 'form-hidden'
        });
    },

    afterRender : function () {
        this.inputEl = this.el;
        this.labelEl = this.el;
        this.bodyEl = this.el;
        this.errorEl = this.el;
        this.inputRow = this.el;
        
        this.callParent();
    },

    renderActiveError : Ext.emptyFn,
    updateLayout :  Ext.emptyFn
});