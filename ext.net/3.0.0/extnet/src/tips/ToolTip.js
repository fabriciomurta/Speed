
// @source core/tips/ToolTip.js

Ext.ToolTip.override({
    recheckTarget: false,

    setTarget: function (target) {
        if (!this.recheckTarget) {
            this.callParent(arguments);
        }

        var targetEl = Ext.net.getEl(target);

        if (targetEl) {
            this.target = targetEl;
            this.callParent([targetEl]);
        } else {
            var getTargetTask = new Ext.util.DelayedTask(this.checkTarget, this);
            
            getTargetTask.delay(1, undefined, this, [ getTargetTask, target ]);
        }
    },

    checkTarget: function (task, target) {
        targetEl = Ext.net.getEl(target);

        if (targetEl) {
            this.setTarget(targetEl);
            task.cancel();
        } else {
            task.delay(500, undefined, this, [task, target]);
        }
    }
});