
// @source core/form/TextField.js

Ext.form.field.Text.prototype.initComponent = Ext.Function.createSequence(Ext.form.field.Text.prototype.initComponent, function () {
    this.addEvents("iconclick");
});

Ext.form.field.Text.prototype.afterRender = Ext.Function.createSequence(Ext.form.field.Text.prototype.afterRender, function () {
    if (this.iconCls) {
        var iconCls = this.iconCls;
        delete this.iconCls;
        this.setIconCls(iconCls);
    }
});

Ext.override(Ext.form.field.Text, {    
    isIconIgnore : function () {
        return !!this.el.up(".x-menu-list-item");
    },

    //private
    renderIconEl : function () {        
        this.inputEl.addCls("x-textfield-icon-input");
        
        this.icon = Ext.core.DomHelper.append(this.inputCell || this.bodyEl, {
            tag   : "div", 
            style : "position:relative;margin:0px;padding:0px;border:0px;float:left;",
            children:[{
                tag   : "div", 
                style : "position:absolute"
            }]
        }, true);            

        this.icon = this.icon.first();
        
        this.icon.on("click", function (e, t) {
            this.fireEvent("iconclick", this, e, t);
        }, this);
    },

    setIconCls : function (cls) {
        if (this.isIconIgnore()) {
            return;
        }
        
        if (!this.icon) {
            this.renderIconEl();
        }       

        if (Ext.isEmpty(cls)) {            
            this.inputEl.removeCls("x-textfield-icon-input");
            this.inputEl.repaint();
            this.restoreIconCls = true;
            this.iconCls = "";
            this.icon.dom.className = "";
        } else {
            if (this.restoreIconCls) {
                delete this.restoreIconCls;
                this.inputEl.addCls("x-textfield-icon-input");
                this.inputEl.repaint();
            }
            
            cls = cls.indexOf('#') === 0 ? X.net.RM.getIcon(cls.substring(1)) : cls;
            this.iconCls = cls;
            this.icon.dom.className = "x-textfield-icon " + cls;
        }        
    },

    getErrors: function (value) {
        var me = this,
            errors = Ext.form.field.Text.superclass.getErrors.apply(this, arguments),
            emptyText = me.emptyText,
            allowBlank = me.allowBlank,
            regex = me.regex,
            format = Ext.String.format,
            msg;

        value = value || me.processRawValue(me.getRawValue());

        if (value.length < 1 || (value === me.emptyText && me.valueContainsPlaceholder)) {
            if (!allowBlank) {
                errors.push(me.blankText);
            }

            return errors;
        }

        if (value.length < me.minLength) {
            errors.push(format(me.minLengthText, me.minLength));
        }

        if (value.length > me.maxLength) {
            errors.push(format(me.maxLengthText, me.maxLength));
        }

        if (regex && !regex.test(value)) {
            errors.push(me.regexText || me.invalidText);
        }

        return errors;
    }
});