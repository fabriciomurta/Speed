Ext.draw.Component.override({
    get : function (key) {
        return this.surface.items.get(key);
    }
});

Ext.draw.Surface.override({
    onAdd: function (sprite) {
        var group = sprite.group,
            draggable = sprite.draggable,
            groups, ln, i;
        if (group) {
            groups = [].concat(group);
            ln = groups.length;
            for (i = 0; i < ln; i++) {
                group = groups[i];
                this.getGroup(group).add(sprite);
            }
            delete sprite.group;
        }
        if (draggable) {
            if (sprite.el) {
                sprite.initDraggable();
            }
            else {
                sprite.on("render", sprite.initDraggable, sprite, {single:true});
            }
        }
    }
});