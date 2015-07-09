
// @source core/form/Picker.js

Ext.form.field.Picker.override({
    config: {
        triggers: {
            picker: {
                weight: 1, // This is added to get the main trigger to be appeared on the right by default.
                handler: 'onTriggerClick',
                scope: 'this'
            }
        }
    }
});