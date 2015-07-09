
// @source core/Tab.js
Ext.tab.Tab.override({
    closable : false,

    setCard : function (card) {
        var me = this;

        me.card = card;
        me.setText(me.title || card.title);
        me.setIconCls(me.iconCls || card.iconCls);
		
        if (me.icon || card.icon) {
            me.setIcon(me.icon || card.icon);
        }
    }
});
