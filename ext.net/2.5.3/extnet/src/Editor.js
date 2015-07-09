
// @source core/Editor.js

Ext.Editor.override({
    activateEvent : "click",
    useHtml : false,
    htmlEncode : false,
    htmlDecode : false,

    initComponent : Ext.Function.createSequence(Ext.Editor.prototype.initComponent, function () {
        this.field.submitValue = false;
        this.initTarget();
    }),

    realign : function (autoSize) {
        var me = this;
        if (autoSize === true) {
            if (this.autoSize) {
                me.updateLayout();

                var autoSizeBehav = this.autoSize,
                    fieldWidth,
                    fieldHeight;

                if (autoSizeBehav === true) {
                    autoSizeBehav =  {
                        width  : 'boundEl',
                        height : 'boundEl'    
                    };
                }                
                
                fieldWidth  = me.getDimension(autoSizeBehav.width,  'getWidth',  this.width);
                fieldHeight = me.getDimension(autoSizeBehav.height, 'getHeight', this.height);

                this.field.setSize(fieldWidth || this.field.getWidth(), fieldHeight || this.field.getHeight());
            }
        }
        me.alignTo(me.boundEl, me.alignment, me.offsets);
    },

    getDimension: function (type, getMethod, size){
        switch (type) {
            case 'boundEl':
                return this.boundEl[getMethod]();

            case 'field':
                return undefined;

            default:
                return size;
        }
    },
    
    initTarget : function () {
        if (this.isSeparate) {
            this.field = Ext.ComponentManager.create(this.field, "textfield");
        }
        
        if (!Ext.isEmpty(this.target, false)) {            
            var targetEl = Ext.net.getEl(this.target);
            
            if (!Ext.isEmpty(targetEl)) {
                this.initTargetEvents(targetEl);
            } else {
                var getTargetTask = new Ext.util.DelayedTask(function (task) {
                    targetEl = Ext.get(this.target);
                    
                    if (!Ext.isEmpty(targetEl)) {                            
                        this.initTargetEvents(targetEl);
                        task.cancel();
                        delete this.getTargetTask;
                    } else {
                        task.delay(500, undefined, this, [task]);
                    }
                }, this);
                this.getTargetTask = getTargetTask;
                getTargetTask.delay(1, undefined, this, [getTargetTask]);
            }
        } 
    },
    
    retarget : function (target) {
        if (this.getTargetTask) {
            this.getTargetTask.cancel();
            delete this.getTargetTask;
        }
        
        this.target = Ext.net.getEl(target);
        
        if (this.target && this.target.un && !Ext.isEmpty(this.activateEvent, false)) {
            if (this.target.isComposite) {
                this.target.each(function (item) {
                    item.un(this.activateEvent, this.activateFn, item.dom);
                }, this);
            } else {
                this.target.un(this.activateEvent, this.activateFn, this.target.dom);            
            }
        }
        
        this.initTargetEvents(this.target);            
    },

    initTargetEvents : function (targetEl) {
        this.target = targetEl;
        
        var ed = this,
            activate = function () {
                if (!ed.disabled) {
                    ed.startEdit(this);
                }
            };
        
        this.activateFn = activate;
        
        if (!Ext.isEmpty(this.activateEvent, false)) {
            if (this.target.isComposite) {
                this.target.each(function (item) {
                    item.on(this.activateEvent, this.activateFn, item.dom);
                }, this);
            } else {
                this.target.on(this.activateEvent, this.activateFn, this.target.dom);            
            }
        }
    },

        // private
    onFieldBlur : function(field, e) {
        var me = this,
            target = Ext.Element.getActiveElement();

        if (me.editing && me.cancelOnBlur === true && me.selectSameEditor !== true) {
            me.cancelEdit();
        }
        else if(me.allowBlur === true && me.editing && me.selectSameEditor !== true) {
            me.completeEdit();
        }

        // If newly active element is focusable, prevent reacquisition of focus by editor owner
        if (Ext.fly(target).isFocusable() || target.getAttribute('tabIndex')) {
            target.focus();
        }
    },

    startEdit : function (el, value) {
        if (!Ext.isDefined(value)) {
            this.completeEdit();
            this.boundEl = Ext.get(el);

            if (this.useHtml) {
                value = this.boundEl.dom.innerHTML;
                if (this.htmlEncode) {                    
                    value = Ext.util.Format.htmlEncode(value);
                }
            }
            else {
                value = Ext.String.trim(this.boundEl.dom[Ext.isGecko ? "textContent" : "innerText"]);                
            }
        }
        
        this.callParent([el, value]);

        if (this.editing && Ext.isIE) {
            this.field.surpressBlur = true;
            Ext.defer(function () {
                this.field.surpressBlur = false;
                this.field.focus();
            }, 250, this);
        }
    },

    completeEdit : function (remainVisible) {
        var me = this,
            field = me.field,
            value;

        if (!me.editing) {
            return;
        }

        // Assert combo values first
        if (field.assertValue) {
            field.assertValue();
        }

        value = me.getValue();
        if (!field.isValid()) {
            if (me.revertInvalid !== false) {
                me.cancelEdit(remainVisible);
                return;
            }
        }

        if (String(value) === String(me.startValue) && me.ignoreNoChange) {
            me.hideEdit(remainVisible);
            return;
        }

        if (me.fireEvent('beforecomplete', me, value, me.startValue) !== false) {
            // Grab the value again, may have changed in beforecomplete
            value = me.getValue();
            if (me.updateEl && me.boundEl) {
                if (this.htmlDecode) {
                    me.boundEl.update(Ext.util.Format.htmlDecode(value));
                }
                else {
                    me.boundEl.update(value);
                }
            }
            me.hideEdit(remainVisible);
            me.fireEvent('complete', me, value, me.startValue);
        }
    }
});

Ext.layout.container.Editor.override({
    autoSizeDefault: {
        width  : 'boundEl',
        height : 'boundEl'    
    }
});