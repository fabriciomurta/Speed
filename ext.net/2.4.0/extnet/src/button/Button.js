
// @source core/buttons/Button.js

Ext.override(Ext.Button, {
	initComponent : function () {
        this.callParent(arguments);

        if (this.flat) {
            this.ui = this.ui + '-toolbar';
            this.focusCls = "";
        }
    },

    onRender : function (el) {
        this.callParent(arguments);

        this.onButtonRender(el);
    },

    getPressedField : function () {
        if (!this.pressedField && (this.hasId() || this.pressedHiddenName)) {
            this.pressedField = new Ext.form.Hidden({ 
                name : this.pressedHiddenName || (this.id + "_Pressed") 
            });

			this.on("beforedestroy", function () {
                this.destroy();                
            }, this.pressedField);
        }
        return this.pressedField;
    },
    
    menuArrow : true,
    
    toggleMenuArrow : function () {
        if (this.menuArrow === false) {
            this.showMenuArrow();
            this.menuArrow = true;
        } else {
            this.hideMenuArrow();
            this.menuArrow = false;
        }
    },
    
    showMenuArrow : function () {
        var el = this.btnWrap;
        
        if (!Ext.isEmpty(el)) {
            el.addCls(this.getSplitCls());            
        }
    },
    
    hideMenuArrow : function () {
        var el = this.btnWrap;
        
        if (!Ext.isEmpty(el)) {
            el.removeCls(this.getSplitCls());            
        }
    },
	
	onButtonRender : function (el) {
		if (this.enableToggle || !Ext.isEmpty(this.toggleGroup)) {
			var field = this.getPressedField();

            if (field) {
                field.render(this.el.parent() || this.el);
            }
		   
			this.on("toggle", function (el, pressed) {
				var field = this.getPressedField();
                
				if (field) {
                    field.setValue(pressed);
                }
			}, this);      
		}    
		
		if (this.menuArrow === false) {
			this.hideMenuArrow();
		}

        if (this.standOut) {
            this.addClsWithUI(this.overCls);
        }
	},

    addOverCls: function() {
        if (!this.disabled && !this.standOut) {
            this.addClsWithUI(this.overCls);
        }
    },
    removeOverCls: function() {
        if (!this.standOut) {
            this.removeClsWithUI(this.overCls);
        }
    },

    setIconCls : function (cls) {
        this.callParent([cls && cls.indexOf('#') === 0 ? X.net.RM.getIcon(cls.substring(1)) : cls]);
    },

    setIcon : function (icon) {
        if(this.iconCls && icon){
            this.setIconCls("");
        }
        this.callParent([icon && icon.indexOf('#') === 0 ? X.net.RM.getIconUrl(icon.substring(1)) : icon]);
    },

    onEnable : function () {
        this.callParent(arguments);

        if (this.standOut) {
            this.addClsWithUI(this.overCls);
        } 
    }
});