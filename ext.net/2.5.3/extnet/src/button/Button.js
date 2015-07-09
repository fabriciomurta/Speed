
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
    },

    setLoading : function (config) {
        if (Ext.isBoolean(this.loadingState)) {
            delete this.loadingState;
        }
        
        this.loadingState = this.loadingState || {};

        var cfg = {};

        this.clearLoadingState = {};
        
        this.suspendLayouts();
        if (config && Ext.isString(config)) {
            this.loadingState.text = config;
        }

        if (Ext.isObject(config)) {
            Ext.apply(this.loadingState, config);            
        }

        config = this.loadingState;

        if (Ext.isDefined(config.glyph)) {
            cfg.glyph = this.glyph || null;
            this.setGlyph(config.glyph);
        }
               
        if (Ext.isDefined(config.iconCls) || (config.iconCls !== null && !Ext.isDefined(config.icon))) {
            cfg.iconCls = this.iconCls || "";
            this.setIconCls(config.iconCls || "x-loading-indicator");
        }

        if (Ext.isDefined(config.icon)) {
            cfg.icon = this.icon || "";
            this.setIcon(config.icon);
        }

        if (config.text !== null) {
            cfg.text = this.text || "";
            this.setText(Ext.isDefined(config.text) ? config.text : "Loading...");
        }

        if (Ext.isDefined(config.tooltip)) {
            cfg.tooltip = this.tooltip || "";
            this.setTooltip(config.tooltip);
        }

        if (Ext.isDefined(config.cls)) {
            cfg.cls = config.cls;
            this.addCls(config.cls);
        }

        if (config.disabled) {
            cfg.disabled = true;
            this.disable();
        }

        if (config.disabled === false) {
            cfg.disabled = false;
            this.enable();
        } else {
            cfg.disabled = true;
            this.disable();
        }

        if (config.hidden) {
            cfg.hidden = true;
            this.hide();
        }

        if (config.width || config.height) {
            cfg.size = this.getSize();
            this.setSize(config.width || cfg.size.width, config.height || cfg.height);
        }

        this.clearLoadingState = cfg;

        this.resumeLayouts(true);
    },

    clearLoading : function () {
        if (this.clearLoadingState) {
            this.suspendLayouts();

            var config = this.clearLoadingState;

            if (Ext.isDefined(config.glyph)) {
                this.setGlyph(config.glyph);
            }

            if (Ext.isDefined(config.iconCls)) {
                this.setIconCls(config.iconCls);
            }

            if (Ext.isDefined(config.icon)) {
                this.setIcon(config.icon);
            }

            if (Ext.isDefined(config.text)) {
                this.setText(config.text);
            }

            if (Ext.isDefined(config.tooltip)) {
                this.setTooltip(config.tooltip);
            }

            if (Ext.isDefined(config.cls)) {
                this.removeCls(config.cls);
            }

            if (config.disabled) {
                this.enable();
            }

            if (config.hidden) {
                this.show();
            }

            if (config.size) {
                this.setSize(config.size);
            }

            delete this.clearLoadingState;

            this.resumeLayouts(true);
        }
    },

    beforeDirectEvent : function (o) {
        if (o.action == "Click" && this.loadingState) {
            this.setLoading();
        }
    },

    afterDirectEvent : function (o) {
        if (o.action == "Click" && this.clearLoadingState) {
            this.clearLoading();
        }
    }
});