
// @source data/Validations.js

Ext.data.validations.length = function(config, value) {
    var length = value ? value.length : 0,
        min    = config.min,
        max    = config.max;
        
    if ((min && length < min) || (max && length > max)) {
        return false;
    } else {
        return true;
    }
}
