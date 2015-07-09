
// @source core/form/TextField.js

Ext.override(Ext.form.field.Text, {    
    leftButtonsShowMode  : "always",
    rightButtonsShowMode : "always",

    isIconIgnore : function () {
        return !!this.el.up(".x-menu-list-item");
    },

    initComponent : function () {
        if (this.inputWidth && !this.width) {           
            this._inputWidth = this.inputWidth;
            delete this.inputWidth;

            this.updateInputWidth();              
        }

        //this.updateButtonsWidth = Ext.Function.createThrottled(this.updateButtonsWidth, 10, this);
        this.setButtonsHiddenNonBuffered = this.setButtonsHidden;
        this.setButtonsHidden = Ext.Function.createBuffered(this.setButtonsHidden, 250, this);
        
        this.callParent(arguments);
        this.addEvents("iconclick");
    },

    setFieldLabel : function () {
        this.callParent(arguments);

        if (this._inputWidth) {
            this.updateInputWidth(true);
        }        
    },

    afterComponentLayout : function () {
        this.callParent(arguments);

        if (this._inputWidth) {
            this.updateInputWidth(true);
        }
    },

    updateInputWidth : function (update) {
        var width = 0;
        if (this.labelAlign !== "top" && (this.fieldLabel || !this.hideEmptyLabel) && !this.hideLabel) {
            width = this.labelWidth + this.labelPad + this._inputWidth;
        } else {
            width = this._inputWidth;
        }

        if (!this.isIndicatorEmpty() || this.preserveIndicatorIcon) {
            if (!this.rendered) {
                var tempEl,
                    indWidth = (tempEl = Ext.getBody().createChild({
                        style: 'position:absolute', 
                        cls: "x-field-indicator " + (this.indicatorCls || ""), 
                        html :  this.indicatorText || "" })).getWidth();
                tempEl.remove(); 

                if(this.indicatorIconCls || this.preserveIndicatorIcon) {
                    indWidth += 18;
                }

                width += indWidth;
            }
            else {
                width += this.indicatorEl.getWidth();
            }
        }          

        this.width = width;

        if (update && this.rendered) {
            this.el.setWidth(width);
        }
    },

    //private
    renderIconEl : function () {        
        var rtl = this.getHierarchyState().rtl;
        this.inputEl.addCls("x-textfield-icon-input");
        
        this.icon = Ext.core.DomHelper.append(this.inputCell || this.bodyEl, {
            tag   : "div", 
            style : "position:relative;margin:0px;padding:0px;border:0px;float:" + (rtl ? "right;" : "left;"),
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
            regex = me.regex,
            format = Ext.String.format,
            msg, 
            trimmed, isBlank;

        value = value || me.processRawValue(me.getRawValue());

        trimmed = me.allowOnlyWhitespace ? value : Ext.String.trim(value);

        if (trimmed.length < 1 || (value === me.emptyText && me.valueContainsPlaceholder)) {
            if (!me.allowBlank) {
                errors.push(me.blankText);
            }

            // If we are not configured to validate blank values, there cannot be any additional errors
            if (!me.validateBlank) {
                return errors;
            }
            isBlank = true;
        }

         // If a blank value has been allowed through, then exempt it dfrom the minLength check.
        // It must be allowed to hit the vtype validation.
        if (!isBlank && value.length < me.minLength) {
            errors.push(format(me.minLengthText, me.minLength));
        }

        if (value.length > me.maxLength) {
            errors.push(format(me.maxLengthText, me.maxLength));
        }

        if (regex && !regex.test(value)) {
            errors.push(me.regexText || me.invalidText);
        }

        return errors;
    },

    afterRender : function () {
        this.callParent(arguments);

        if (this.iconCls) {
            var iconCls = this.iconCls;
            delete this.iconCls;
            this.setIconCls(iconCls);
        }

        if (this.removeClearTrigger) {
            this.inputEl.addCls("x-clear-field");
        }

        this.initButtons();
    },

    updateButtonsWidth : function () {
        if (this.bulkButtonsUpdate) {
            this.needUpdateAfterBulk = true;
            return;
        }

        var field = this,
            el;

        if (field.leftButtons || field.rightButtons) {
            if (!field.isButtonsInit) {
                field.initButtons(false);
            }

            var w = 0,
                i,
                len;

            if (field.leftButtons) {
                for (i = 0, len = field.leftButtons.length; i < len; i++ ) {
                    w = w + field.leftButtons[i].getWidth();
                }
            }

            if (field.rightButtons) {
                for (i = 0, len = field.rightButtons.length; i < len; i++ ) {
                    w = w + field.rightButtons[i].getWidth();
                }
            }

            el = field.inputEl;

            w = el.parent().getWidth() - w - (field.buttonsOffset || 3);
            
            if (w != el.getWidth()) {
                el.setWidth(w);
            }
        }
    },

    initButtons: function (doLayout) {
        if (this.leftButtons) {
            this.leftButtons = this.initButtonsSide(this.leftButtons, "left");
        }

        if (this.rightButtons) {
            this.rightButtons = this.initButtonsSide(this.rightButtons, "right");
        }

        if (this.leftButtonsShowMode == "mouseover" || this.leftButtonsShowMode == "mouseovernonblank" || this.leftButtonsShowMode == "mouseoverorfocus" ||
            this.rightButtonsShowMode == "mouseover" || this.rightButtonsShowMode == "mouseovernonblank" || this.rightButtonsShowMode == "mouseoverorfocus") {

            this.bodyEl.on({
                mouseover : this.onMouseOver,
                mouseout : this.onMouseOut,
                scope : this
            });
        }

        if (doLayout !== false && (this.leftButtons || this.rightButtons)) {
            this.doComponentLayout();
        }

        this.isButtonsInit = true;
    },

    isButtonsVisible : function (side) {
        var mode = this[side + "ButtonsShowMode"];
        switch (mode) {
            case "focus" :
                return this.hasFocus;
            case "mouseover" :
                return this.hasMouse;
            case "nonblank" :
                return this.getRawValue().length > 0;
            case "mouseovernonblank" :
                return this.hasMouse && this.getRawValue().length > 0;
            case "mouseoverorfocus" :
                return this.hasMouse || this.hasFocus;
            case "always" :
            default:
                return true;
        }        
    },

    addButton : function (button, side, doLayout) {                
        side = side || "right";
        button.flat = true;
        button.style = "float:" + side + ";";
        button.height = 20;
        
        if (this[side + "ButtonsShowMode"] != "always") {
            button.hidden = !this.isButtonsVisible(side);
        }

        if (!this.initButtonsCls) {
            (this.inputCell || this.bodyEl).addCls(["x-form-field", "x-form-text", "x-field-buttons-body"]);
            this.bodyEl.addCls("x-field-toolbar-body");

            this.inputEl.addCls = Ext.Function.createSequence(this.inputEl.addCls, function (cls){
                (this.inputCell || this.bodyEl).addCls(cls);
            }, this);

            this.inputEl.removeCls = Ext.Function.createSequence(this.inputEl.removeCls, function (cls){
                (this.inputCell || this.bodyEl).removeCls(cls);
            }, this);

            this.initButtonsCls = true;
        }

        var btn = Ext.ComponentManager.create(button, "button");
                
        btn.field = this;
        btn.fieldSide = side;
        btn.ownerCt = this;

        btn.on("destroy", function (btn) {
            if (this.isDestroying) {
                return;
            }

            Ext.Array.remove(btn.fieldSide === "right" ? this.rightButtons : this.leftButtons, btn);
            Ext.defer(this.doComponentLayout, 1, this);                    
        }, this);

        btn.on({
            show : this.updateButtonsWidth,
            hide : this.updateButtonsWidth,
            resize : this.updateButtonsWidth,
            scope : this
        });

        btn.render(this.inputCell || this.bodyEl, side == "left" ? this.inputEl : undefined);                

        if (doLayout !== false) {
            this.doComponentLayout();
        }

        return btn;
    },

    removeButton : function (button) {
        button.destroy();
    },

    initButtonsSide : function (buttons, side) {
        var i,
            len;

        if(side == "right") {
            len = buttons.length;
            i = len - 1;
            for (; i >= 0; i-- ) {
                buttons[i] = this.addButton(buttons[i], side, false);
            }
        }
        else {
            for (i = 0, len = buttons.length; i < len; i++ ) {
                buttons[i] = this.addButton(buttons[i], side, false);
            }
        }

        return buttons;
    },

    destroy : function () {
        this.isDestroying = true;
        if (this.leftButtons) {
            Ext.each(this.leftButtons, function (btn) {
                if (btn.destroy) {
                    btn.destroy();
                }
            });
            delete this.leftButtons;
        }

        if (this.rightButtons) {
            Ext.each(this.rightButtons, function (btn) {
                if (btn.destroy) {
                    btn.destroy();
                }
            });
            delete this.rightButtons;
        }

        this.callParent(arguments);
    },

    setButtonsDisabled : function (disabled, side) {
        if (this.leftButtons && (!Ext.isDefined(side) || side == "left")) {
            Ext.each(this.leftButtons, function (btn) {
                btn.setDisabled(disabled);
            });
        }

        if (this.rightButtons && (!Ext.isDefined(side) || side == "right")) {
            Ext.each(this.rightButtons, function (btn) {
                btn.setDisabled(disabled);
            });
        }
    },

    setButtonsHidden: function (hidden, side) {        
        var method = !hidden ? "show" : "hide";

        this.bulkButtonsUpdate = true;

        if (this.leftButtons && (!Ext.isDefined(side) || side.indexOf("left") > -1)) {
            Ext.each(this.leftButtons, function (btn) {
                if (!btn.hiddenPin) {
                    btn[method](false);
                }
            });
        }

        if (this.rightButtons && (!Ext.isDefined(side) || side.indexOf("right") > -1)) {
            Ext.each(this.rightButtons, function (btn) {
                if (!btn.hiddenPin) {
                    btn[method](false);
                }
            });
        }
        this.bulkButtonsUpdate = false;

        if (this.needUpdateAfterBulk) {
            delete this.needUpdateAfterBulk;
            this.updateButtonsWidth();
        }
    },

    //private
    onDisable: function(){
        this.callParent();
        this.setButtonsDisabled(true);
    },

    //private
    onEnable: function(){
        this.callParent();
        this.setButtonsDisabled(false);
    },

    getButtonsSide: function(left, right) {
        var side = "";
      
        if (left) {
            side += "left";
        }

        if (right) {
            side += "right";
        }

        return side;
    },

    onFocus: function() {
        this.callParent(arguments);
        this.setButtonsHidden(false, this.getButtonsSide(this.leftButtons && (this.leftButtonsShowMode == "focus" || this.leftButtonsShowMode == "mouseoverorfocus"), 
                                                         this.rightButtons && (this.rightButtonsShowMode == "focus" || this.rightButtonsShowMode == "mouseoverorfocus")));
    },

    postBlur : function(){
        this.callParent(arguments);
        this.setButtonsHidden(true, this.getButtonsSide(this.leftButtons && (this.leftButtonsShowMode == "focus" || (this.leftButtonsShowMode == "mouseoverorfocus" && !this.hasMouse)), 
                                                         this.rightButtons && (this.rightButtonsShowMode == "focus" || (this.rightButtonsShowMode == "mouseoverorfocus" && !this.hasMouse))));
    },

    onMouseOver: function() {
        this.hasMouse = true;
        this.setButtonsHidden(false, this.getButtonsSide(this.leftButtons && (this.leftButtonsShowMode == "mouseover" || this.leftButtonsShowMode == "mouseoverorfocus" || (this.leftButtonsShowMode == "mouseovernonblank" && this.getRawValue().length > 0)),
                                                         this.rightButtons && (this.rightButtonsShowMode == "mouseover" || this.rightButtonsShowMode == "mouseoverorfocus" || (this.rightButtonsShowMode == "mouseovernonblank" && this.getRawValue().length > 0))));

    }, 

    onMouseOut: function() {                  
        this.hasMouse = false;
        this.setButtonsHidden(true, this.getButtonsSide(this.leftButtons && (this.leftButtonsShowMode == "mouseover" || (this.leftButtonsShowMode == "mouseoverorfocus" && !this.hasFocus) || this.leftButtonsShowMode == "mouseovernonblank"),
                                                        this.rightButtons && (this.rightButtonsShowMode == "mouseover" || (this.rightButtonsShowMode == "mouseoverorfocus" && !this.hasFocus) || this.rightButtonsShowMode == "mouseovernonblank")));

    }, 

    onChange : function () {
        var nonEmpty;

        this.callParent(arguments);

        if (this.leftButtons && (this.leftButtonsShowMode == "nonblank" || this.leftButtonsShowMode == "mouseovernonblank")) {
            nonEmpty = this.getRawValue().length > 0;

            if ((this.leftButtonsShowMode == "nonblank" && nonEmpty) || 
                (this.leftButtonsShowMode == "mouseovernonblank" && nonEmpty && this.hasMouse)) {
                this.setButtonsHiddenNonBuffered(false, "left");
            }
            else {
                this.setButtonsHiddenNonBuffered(true, "left");
            }
        }

        if (this.rightButtons && (this.rightButtonsShowMode == "nonblank" || this.rightButtonsShowMode == "mouseovernonblank")) {
            nonEmpty = this.getRawValue().length > 0;

            if ((this.rightButtonsShowMode == "nonblank" && nonEmpty) || 
                (this.rightButtonsShowMode == "mouseovernonblank" && nonEmpty && this.hasMouse)) {
                this.setButtonsHiddenNonBuffered(false, "right");
            }
            else {
                this.setButtonsHiddenNonBuffered(true, "right");
            }
        }
    }
});