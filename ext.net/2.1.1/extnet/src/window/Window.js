
// @source core/Window.js

Ext.window.Window.override({
    closeAction     : "hide",    
    defaultRenderTo : "body",

    initComponent : function () {
        this.callParent(arguments);

        if (Ext.isIE && this.modal) {
            this.on("show", function () {
                this.zIndexManager._onContainerResize();
            }, this, { delay : 10 });
        }
    },

    initContainer : function (container) {
        var me = this;

        if (!container && me.el) {
            container = me.el.dom.parentNode;
            me.allowDomMove = false;
        }

        me.container = container.dom ? container : Ext.get(container);

        if (this.container.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom) {
            me.container = Ext.getBody();
        }

        return me.container;
    }, 

    onAdded : function () {
        this.callParent(arguments);

        if (this.initialConfig && this.initialConfig.hidden === false && this.ownerCt) {
            if (this.ownerCt.rendered) {
                this.show();
            } else {
                this.ownerCt.on("afterlayout", function () {
                    this.show();
                }, this, { single : true, delay : 10 });
            }
        }  
    },

    render : function (container, position) {
        var me = this,
            el = me.el && (me.el = Ext.get(me.el)), 
            tree,
            nextSibling;

        Ext.suspendLayouts();

        container = container.dom ? container : Ext.get(container);

        var newcontainer = me.initContainer(container);

        if (container.dom != (Ext.net.ResourceMgr.getAspForm() || {}).dom) {                   
            container = newcontainer;            
        }

        nextSibling = me.getInsertPosition(position);

        if (!el) {
            tree = me.getRenderTree();

            if (nextSibling) {
                el = Ext.DomHelper.insertBefore(nextSibling, tree);
            } else {
                el = Ext.DomHelper.append(container, tree);
            }

            me.wrapPrimaryEl(el);
        } else {            
            me.initStyles(el);

            if (me.allowDomMove !== false) {
                if (nextSibling) {
                    container.dom.insertBefore(el.dom, nextSibling);
                } else {
                    container.dom.appendChild(el.dom);
                }
            }
        }

        me.finishRender(position);

        Ext.resumeLayouts(!container.isDetachedBody);    
        
        if (me.initialConfig && 
           me.initialConfig.hidden === false &&            
           !Ext.isDefined(me.initialConfig.pageX) && 
           !Ext.isDefined(me.initialConfig.pageY) &&
           !Ext.isDefined(me.initialConfig.x) && 
           !Ext.isDefined(me.initialConfig.y)) {
           me.center();           
        }

        if (me.initialConfig && me.initialConfig.hidden === false) {
           me.toFront();           
        }    
    },

    doAutoRender : function () {
        var me = this;

        if (!me.rendered) {
            var form = Ext.net.ResourceMgr.getAspForm(),
                ct = ((this.defaultRenderTo === "body" || !form) ? Ext.getBody() : form);

            if (me.floating) {
                me.render(ct);
            } else {
                me.render(Ext.isBoolean(me.autoRender) ? ct : me.autoRender);
            }
        }
    }
});

Ext.window.MessageBox.override({
    updateButtonText : function () {
        var me = this,
            btnId,
            btn,
            buttons = 0;

        for (btnId in me.buttonText) {
            if (me.buttonText.hasOwnProperty(btnId)) {
                btn = me.msgButtons[btnId];
                if (btn) {
                    if (me.cfg && me.cfg.buttons && Ext.isObject(me.cfg.buttons)) {
                        buttons = buttons | Math.pow(2, Ext.Array.indexOf(me.buttonIds, btnId));
                    }

                    if (btn.text != me.buttonText[btnId]) {
                        btn.setText(me.buttonText[btnId]);
                    }
                }
            }
        }

        return buttons;
    }
});