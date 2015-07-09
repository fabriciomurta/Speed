
// @source core/toolbar/Toolbar.js

Ext.toolbar.Toolbar.override({
    onBeforeAdd: function(component) {
        var me = this,
            isButton = component.isButton;

        if (isButton && me.defaultButtonUI && component.ui === 'default' &&
            !component.hasOwnProperty('ui')) {
            component.ui = me.defaultButtonUI;
        } else if ((isButton || component.isFormField) && me.ui !== 'footer' && (this.classicButtonStyle !== true && component.flat !== false)) {
            component.ui = component.ui + '-toolbar';
            if (isButton) {
                component.focusCls = "";
            }
            component.addCls(component.baseCls + '-toolbar');
        }

        // Any separators needs to know if is vertical or not
        if (component instanceof Ext.toolbar.Separator) {
            component.setUI((me.vertical) ? 'vertical' : 'horizontal');
        }

        Ext.toolbar.Toolbar.superclass.onBeforeAdd.call(this,arguments);
    }
});