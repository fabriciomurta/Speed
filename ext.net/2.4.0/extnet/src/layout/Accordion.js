
// @source core/layout/Accordion.js

Ext.layout.container.Accordion.override({
    onChildPanelRender : function (panel) {
        if (!this.originalHeader) {
            panel.header.addCls(Ext.baseCSSPrefix + 'accordion-hd');
        }        
    },

    updatePanelClasses : function (ownerContext) {
        this.callParent(arguments);

        for (var i = 0; i < ownerContext.visibleItems.length; i++) {
            if (this.originalHeader) {
                ownerContext.visibleItems[i].header.removeCls(Ext.baseCSSPrefix + 'accordion-hd');
            }
        }
    }
});

Ext.layout.container.Accordion.prototype.beforeRenderItems = Ext.Function.createInterceptor(Ext.layout.container.Accordion.prototype.beforeRenderItems, function (items) {
    var i, len;

    for (i = 0, len = items.length; i < len; i++) {
        if (!(items[i] instanceof Ext.panel.AbstractPanel)) {
            throw Ext.String.format("The container {0} with AccordionLayout cannot have non-Panel items: {1}", this.owner.id, items[i].id);
        }
    }
});
