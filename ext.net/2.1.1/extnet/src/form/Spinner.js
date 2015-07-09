
// @source core/form/TriggerField.js

Ext.form.field.Spinner.override({    
    onRender : function () {
        this.callParent(arguments);

        this.triggerCell = new Ext.dom.CompositeElement(this.el.down(".x-trigger-index-0").up("td"), this.el);        
    },

    getTriggerMarkup: function () {
        var me = this;

        return me.getTpl('triggerTpl').apply({
            triggerStyle: 'width:' + me.triggerWidth + 'px'
        });
    },
    
    onTriggerWrapClick : function () {
        var me = this,
            targetEl, match,
            triggerClickMethod,
            event;

        event = arguments[me.triggerRepeater ? 1 : 0];
        if (event && !me.readOnly && !me.disabled) {
            targetEl = event.getTarget('.' + me.triggerBaseCls, null);
            match = targetEl && targetEl.className.match(me.triggerIndexRe);

            if (match) {
                triggerClickMethod = me['onTrigger' + (parseInt(match[1], 10) + 1) + 'Click'] || me.onTriggerClick;
                if (triggerClickMethod) {
                    triggerClickMethod.call(me, event);
                }
            }
        }
    }
});