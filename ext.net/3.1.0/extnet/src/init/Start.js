Ext.ns("Ext.net", "Ext.ux", "Ext.ux.plugins", "Ext.ux.layout");
Ext.net.Version = "3.1.0";

Ext.validIdRe = /^[a-z_][a-z0-9\-_\.]*$/i;
Ext.dom.Element.prototype.validIdRe = Ext.validIdRe;
Ext.mixin.Observable.prototype.validIdRe = Ext.validIdRe;
Ext.Component.prototype.validIdRe = Ext.validIdRe;
Ext.form.trigger.Trigger.prototype.validIdRe = Ext.validIdRe;

if (Ext.os.deviceType == "Desktop" && Ext.isIE) { // #624
    Ext.define('EXTJS-13775', {
        override: 'Ext.dom.Element'
    }, function (Element) {
        var eventMap = Element.prototype.eventMap;

        eventMap.click = 'click';
        eventMap.dblclick = 'dblclick';
    });
}

Ext.event.Event.override({ // #680
    constructor: function (event, info, touchesMap, identifiers) {
        var me = this;
        me.callParent(arguments);

        if (Ext.isGecko && me.type === "click" && me.button === 2) {
            me.type = "contextmenu";
        }
    }
});

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

Ext.define('Ext.overrides.util.Collection', { // #656
    override: 'Ext.util.Collection',
    compatibility: '5.1.0.107',

    updateKey: function (item, oldKey) {
        var me = this,
            map = me.map,
            indices = me.indices,
            source = me.getSource(),
            newKey;

        if (source && !source.updating) {
            // If we are being told of the key change and the source has the same idea
            // on keying the item, push the change down instead.
            source.updateKey(item, oldKey);
        }
        // If there *is* an existing item by the oldKey and the key yielded by the new item is different from the oldKey...
        else if (map[oldKey] && (newKey = me.getKey(item)) !== oldKey) {
            if (oldKey in map || map[newKey] !== item) {
                if (oldKey in map) {
                    //<debug>
                    if (map[oldKey] !== item) {
                        Ext.Error.raise('Incorrect oldKey "' + oldKey +
                                        '" for item with newKey "' + newKey + '"');
                    }
                    //</debug>

                    delete map[oldKey];
                }

                // We need to mark ourselves as updating so that observing collections
                // don't reflect the updateKey back to us (see above check) but this is
                // not really a normal update cycle so we don't call begin/endUpdate.
                me.updating++;

                me.generation++;
                map[newKey] = item;
                if (indices) {
                    indices[newKey] = indices[oldKey];
                    delete indices[oldKey];
                }

                me.notify('updatekey', [{
                    item: item,
                    newKey: newKey,
                    oldKey: oldKey
                }]);

                me.updating--;
            }
        }
    }
});

// #496
Ext.Array.each(Ext.feature.tests, function(test) {
    if (test.name === "RightMargin") {
        test.fn = function(doc, div) {
            var view = doc.defaultView;

            if (Ext.isGecko) {
                return true;
            } else {
                return !(view && view.getComputedStyle(div.firstChild.firstChild, null).marginRight != '0px');
            }

            return true;

        }
    }

    if (test.name === "TransparentColor") {
        test.fn = function(doc, div) {
            var view = doc.defaultView;

            if (Ext.isGecko) {
                return true;
            } else {
                return !(view && view.getComputedStyle(div.lastChild, null).backgroundColor != 'transparent');
            }

            return true;
        }
    }
});