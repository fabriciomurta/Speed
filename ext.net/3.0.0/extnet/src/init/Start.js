Ext.ns("Ext.net", "Ext.ux", "Ext.ux.plugins", "Ext.ux.layout");
Ext.net.Version = "3.0.0";

Ext.validIdRe = /^[a-z_][a-z0-9\-_\.]*$/i;
Ext.dom.Element.prototype.validIdRe = Ext.validIdRe;
Ext.mixin.Observable.prototype.validIdRe = Ext.validIdRe;
Ext.Component.prototype.validIdRe = Ext.validIdRe;
Ext.form.trigger.Trigger.prototype.validIdRe = Ext.validIdRe;

if (Ext.os.deviceType == "Desktop" && Ext.isIE) {
    Ext.define('EXTJS-13775', {
        override: 'Ext.dom.Element'
    }, function (Element) {
        var eventMap = Element.prototype.eventMap;

        eventMap.click = 'click';
        eventMap.dblclick = 'dblclick';
    });
}

Ext.net.reconfigure = function (inst, initConfig, config) {
    var property,
        defaults = {},
        apply = false;

    if (initConfig) {
        for (property in config) {
            if (config.hasOwnProperty(property)) {
                if (typeof initConfig[property] === 'undefined') {
                    defaults[property] = config[property];
                    apply = true;
                }
            }
        }
    }
    else {
        defaults = config;
        apply = true;
    }

    if (apply) {
        inst.getConfigurator().reconfigure(inst, defaults);
    }
};