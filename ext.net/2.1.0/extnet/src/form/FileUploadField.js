
// @source core/form/FileUploadField.js

Ext.form.field.File.override({
    stripPath : true,

    isIconIgnore : function () {
        return true;
    },

    onFileChange : function () {
        this.lastValue = null;

        if (this.stripPath === false) {
            Ext.form.field.File.superclass.setValue.call(this, this.fileInputEl.dom.value);
            return;
        }

        var v = this.fileInputEl.dom.value,                
            fileNameRegex = /[^\\]*$/im,
            match = fileNameRegex.exec(v);
                    
        if (match !== null) {
	        v = match[0];
        }

        Ext.form.field.File.superclass.setValue.call(this, v);
    },

    onEnable: function () {
        var me = this;
        me.callParent();
        me.fileInputEl.dom.removeAttribute("disabled");
        this['buttonEl-btnEl'].dom.removeAttribute("disabled");
        me.browseButtonWrap.child('.x-btn').removeCls(["x-item-disabled", "x-btn-disabled"]);
    },

    disableItems: function () {
        var file = this.fileInputEl;
        if (file) {
            file.dom.disabled = true;
        }
        this['buttonEl-btnEl'].dom.disabled = true;
        this.browseButtonWrap.child('.x-btn').addCls(["x-item-disabled", "x-btn-disabled"]);
    },

    checkChange: function () {
        if (!this.suspendCheckChange) {
            var me = this,
                newVal = me.getValue(),
                oldVal = me.lastValue;
            if (!me.isEqual(newVal, oldVal) && !me.isDestroyed && !Ext.isEmpty(newVal)) {
                me.lastValue = newVal;
                me.fireEvent('change', me, newVal, oldVal);
                me.onChange(newVal, oldVal);
            }
        }
    }
});