Ext.draw.sprite.Composite.override({
    constructor: function (config) {
        var sprites = config.sprites;
        this.callParent(arguments);

        if (sprites) {
            this.addAll(sprites);
        }
    }
});

Ext.draw.sprite.Sprite.override({
    constructor: function (config) {
        this.callParent(arguments);
    },

    setAttributes: function (changes, bypassNormalization, avoidCopy) {
        if (changes) {
            var duration = Ext.isDefined(changes.duration),
                easing = Ext.isDefined(changes.easing);

            if (duration) {
                this.fx.setDuration(changes.duration);
            }

            if (easing) {
                this.fx.setEasing(changes.easing);
            }
        }

        this.callParent(arguments);
    }
});