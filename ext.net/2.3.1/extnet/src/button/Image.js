
// @source core/buttons/ImageButton.js

Ext.define("Ext.net.ImageButton", {
    extend : "Ext.button.Button",
    alias  : "widget.netimagebutton",
    cls    : "",
    iconAlign      : "left",
    initRenderTpl: Ext.emptyFn,
    componentLayout : null,
    autoEl: 'img',
    frame: false,

    initComponent : function () {
        this.scale = null;
        this.callParent();       
        
        this.autoEl = {
            tag: 'img',
            role: 'button',
            hidefocus: 'on',
            unselectable: 'on'
        };
        
        var i;
        
        if (this.imageUrl) {
            i = new Image().src = this.imageUrl;
        }

        if (this.overImageUrl) {
            i = new Image().src = this.overImageUrl;
        }

        if (this.disabledImageUrl) {
            i = new Image().src = this.disabledImageUrl;
        }

        if (this.pressedImageUrl) {
            i = new Image().src = this.pressedImageUrl;
        }
    },

    getElConfig : function () {
        return Ext.apply(this.callParent(), {
            tag : "img",
            id : this.getId(),
            src: this.imageUrl,
            style: this.getStyle()
        });
    },

    getStyle: function () {
        var style = "border:none;cursor:pointer;";

        if (this.style) {
            style += this.style;
        }

        if (this.height) {
            style += "height:" + this.height + "px;";
        }

        if (this.width) {
            style += "width:" + this.width + "px;";
        }

        return style;
    },

    applyChildEls : function () {
         this.callParent(arguments);
         this.btnEl = this.el;
    },

    onRender : function (ct, position) {
        this.imgEl = this.el;

        if (!Ext.isEmpty(this.imgEl.getAttributeNS("", "width"), false) ||
            !Ext.isEmpty(this.imgEl.getAttributeNS("", "height"), false)) {
            this.imgEl.dom.removeAttribute("width");
            this.imgEl.dom.removeAttribute("height");
        }

        if (this.altText) {
            this.imgEl.dom.setAttribute("alt", this.altText);
        }

        if (this.align && this.align !== "notset") {
            this.imgEl.dom.setAttribute("align", this.align);
        }

        if (this.pressed && this.pressedImageUrl) {
            this.imgEl.dom.src = this.pressedImageUrl;
        }

        if (this.disabled && this.disabledImageUrl) {
            this.imgEl.dom.src = this.disabledImageUrl;
        }

        if (this.tabIndex !== undefined) {
            this.imgEl.dom.tabIndex = this.tabIndex;
        }
        
        //this.imgEl.on(this.clickEvent, this.onClick, this);		
            		
		if (this.href) {
			this.on("click", function () {
				if (this.target) {
					window.open(this.href, this.target);
				} else {
					window.location = this.href;
				}
			}, this);
		}
			
        this.callParent();
    },

    // private
    onMenuShow : function (e) {
        this.ignoreNextClick = 0;
        this.fireEvent("menushow", this, this.menu);
    },
    
    // private
    onMenuHide : function (e) {
        this.ignoreNextClick = Ext.defer(this.restoreClick, 250, this);
        this.fireEvent("menuhide", this, this.menu);
    },

    getTriggerSize : function () {
        return 0;
    },

    toggle: function (state, suppressEvent, suppressHandler) {
        state = state === undefined ? !this.pressed : !!state;

        if (state != this.pressed) {
            if (state) {
                if (this.pressedImageUrl) {
                    this.imgEl.dom.src = this.pressedImageUrl;
                }
 
                this.pressed = true;
            } else {
                this.imgEl.dom.src = (this.monitoringMouseOver) ? this.overImageUrl : this.imageUrl;
                this.pressed = false;
            }

            if (!suppressEvent) {
                this.fireEvent("toggle", this, this.pressed);
            }
                        
            if (this.toggleHandler && !suppressHandler) {
                this.toggleHandler.call(this.scope || this, this, state);
            }
        }
        return this;
    },

    setText : Ext.emptyFn,

    setDisabled : function (disabled) {
        this.disabled = disabled;
        
        if (this.imgEl && this.imgEl.dom) {
            this.imgEl.dom.disabled = disabled;
        }
        
        if (disabled) {
            if (this.disabledImageUrl) {
                this.imgEl.dom.src = this.disabledImageUrl;
            } else {
                this.imgEl.addCls(this.disabledClass);
            }
        } else {
            this.imgEl.dom.src = this.imageUrl;
            this.imgEl.removeCls(this.disabledClass);
        }
    },
    
    onMouseOver : function (e) {
        if (!this.disabled) {
            var internal = e.within(this.el.dom, true);

            if (!internal) {
                if (this.overImageUrl && !this.pressed) {
                    this.imgEl.dom.src = this.overImageUrl;
                }

                if (!this.monitoringMouseOver) {
                    this.doc.on("mouseover", this.monitorMouseOver, this);
                    this.monitoringMouseOver = true;
                }
            }
        }

        this.fireEvent("mouseover", this, e);
    },
    
    monitorMouseOver : function (e) {
        if (e.target != this.el.dom && !e.within(this.el)) {
            if (this.monitoringMouseOver) {
                this.doc.un('mouseover', this.monitorMouseOver, this);
                this.monitoringMouseOver = false;
            }
            this.onMouseOut(e);
        }
    },
    
    onMouseEnter : function (e) {
        if (this.overImageUrl && !this.pressed && !this.disabled) {
            this.imgEl.dom.src = this.overImageUrl;
        }
        this.fireEvent("mouseover", this, e);
    },

    // private
    onMouseOut : function (e) {
        if (!this.disabled && !this.pressed) {
            this.imgEl.dom.src = this.imageUrl;
        }
        
        this.fireEvent("mouseout", this, e);
    },

    onMouseDown : function (e) {
        var me = this;

        if (Ext.isIE) {
            // In IE the use of unselectable on the button's elements causes the element
            // to not receive focus, even when it is directly clicked.
            me.getFocusEl().focus();
        }

        if (!me.disabled && e.button === 0) {
            if (me.pressedImageUrl) {
                me.imgEl.dom.src = me.pressedImageUrl;
            }
            
            Ext.button.Manager.onButtonMousedown(me, e);
        }
    },
    
    // private
    onMouseUp : function (e) {
        if (e.button === 0) {
            this.imgEl.dom.src = (this.overImageUrl && this.monitoringMouseOver) ? this.overImageUrl : this.imageUrl;
        }
    },
    
    setImageUrl : function (image) {
        this.imageUrl = image;
        
        if ((!this.disabled || Ext.isEmpty(this.disabledImageUrl, false)) && 
            (!this.pressed || Ext.isEmpty(this.pressedImageUrl, false))) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setDisabledImageUrl : function (image) {
        this.disabledImageUrl = image;
        
        if (this.disabled) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setOverImageUrl : function (image) {
        this.overImageUrl = image;
        
        if ((!this.disabled || Ext.isEmpty(this.disabledImageUrl, false)) &&            
            (!this.pressed || Ext.isEmpty(this.pressedImageUrl, false))) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setPressedImageUrl : function (image) {
        this.pressedImageUrl = image;
        
        if ((!this.disabled || Ext.isEmpty(this.disabledImageUrl, false)) && this.pressed) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setAlign : function (align) {
        this.align = align;
        
        if (this.rendered) {
            this.imgEl.dom.setAttribute("align", this.align);
        }
    },

    setAltText : function (altText) {
        this.altText = altText;
        
        if (this.rendered) {
            this.imgEl.dom.setAttribute("altText", this.altText);
        }
    }
});