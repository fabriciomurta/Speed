
// @source src/grid/filter/TriFilter.js

Ext.grid.filters.filter.TriFilter.override({
    constructor: function (config) { // The GitHub issue #540
        this.callParent([config]);

        if (this.active && this.column && this.owner) {
            this.column.addCls(this.owner.filterCls);
        }
    },

    setValue: function (value) { // The GitHub issue #543
        if (!this.menu) {
            this.createMenu();
        }

        this.callParent(arguments);
    },

    setActive: function (active) { // The GitHub issue #545
        var me = this,
            owner = me.owner,
            menuItem = owner.activeFilterMenuItem,
            filterCollection;

        if (me.active !== active) {
            me.active = active;

            if (!me.settingValue) { // That is the fix
                filterCollection = me.getStore().getFilters();
                filterCollection.beginUpdate();

                if (active) {
                    me.activate();
                } else {
                    me.deactivate();
                }

                filterCollection.endUpdate();
            }

            // Make sure we update the 'Filters' menu item.
            if (menuItem && menuItem.activeFilter === me) {
                menuItem.setChecked(active);
            }

            me.column[active ? 'addCls' : 'removeCls'](owner.filterCls);

            // TODO: fire activate/deactivate
        }
    }
});