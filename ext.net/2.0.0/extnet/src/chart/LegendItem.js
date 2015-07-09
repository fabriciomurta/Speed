Ext.chart.LegendItem.override({
    createLegend : function () {
        var me = this;

        this.callParent(arguments);

        if (me.legend.refreshOnItemToggle) {
             me.on('mousedown', function () {
                me.legend.chart.refresh();
            }, me);
        }
    }
});