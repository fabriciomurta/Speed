
// @source core/form/Display.js

Ext.form.field.Display.override({    
    fieldSubTpl: [
        '<div id="{id}" class="{fieldCls}" <tpl if="fieldStyle"> style="{fieldStyle}"</tpl>>{value}</div>',
        {
            compiled: true,
            disableFormats: true
        }
    ],
    
    // Appends the specified string and a new line to the DisplayField's value.
    // Options:
    //      text - a string to append.
    appendLine : function (text) {
        this.append(text + "<br/>");
    }
});