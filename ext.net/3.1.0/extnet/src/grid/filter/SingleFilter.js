
// @source src/grid/filter/SingleFilter.js

Ext.grid.filters.filter.SingleFilter.override({
    constructor: function (config) { // The GitHub issue #540
        this.callParent([config]);

        if (this.active && this.column && this.owner) {
            this.column.addCls(this.owner.filterCls);
        }
    }
});