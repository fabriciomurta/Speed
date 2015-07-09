
// @source core/container/Container.js

Ext.Container.override({
    getBody : function (focus) {
        if (this.iframe) {
            var self = this.getWin();            
            
            if (focus !== false) {
                try {
                    self.focus();
                } catch (e) { }
            }

            return self;
        }

        return Ext.get(this.id + "_Content") || this.body;
    },

    reload : function (disableCaching) {
        var loader = this.getLoader();
        loader.load(Ext.applyIf({ disableCaching : disableCaching }, loader.lastOptions || {} ));
    },

    load : function (config) {
        this.getLoader().load(config);
    },

    clearContent : function () {
        if (this.iframe && this.iframe.dom) {
            var me = this,
                doc,
                prop;

            this.iframe.un("load", this.getLoader().afterIFrameLoad, this);

            try {
                doc = me.getDoc();
                
                if (doc) {
                    if (!Ext.isIE) {
                        Ext.EventManager.removeAll(doc);
                    }

                    for (prop in doc) {
                        if (doc.hasOwnProperty && doc.hasOwnProperty(prop)) {
                            delete doc[prop];
                        }
                    }
                }

                this.iframe.dom.contentWindow.parentAutoLoadControl = null;
            } catch(e) { } 
            
            try {
                this.iframe.dom.src = Ext.SSL_SECURE_URL;
                Ext.destroy(this.iframe);
                delete this.iframe;
                this.removeAll(true);
            } catch(e) { }

            this.getLoader().removeMask();
            
        } else if (this.rendered) {
            this.body.dom.innerHTML = "";
        }
    },    

    beforeDestroy : function () {
        if (this.iframe && this.iframe.dom) {
            try {                
                this.clearContent();
            } catch (e) { }
        }
        this.destroyContentWidgets(true);
        this.destroyContentWidgets = Ext.emptyFn;
        this.callParent(arguments);
    },

    onRender : Ext.Function.createSequence(Ext.container.Container.prototype.onRender, function () {
        this.mon(this.el, Ext.EventManager.getKeyEvent(), this.fireKey,  this);
    }),

    fireKey : function (e) {
        if (e.getKey() === e.ENTER) {
            var tagRe = /textarea/i,
                target = e.target;

            contentEditable = target.contentEditable;            
            if (tagRe.test(target.tagName) || (contentEditable === '' || contentEditable === 'true')) {
                return;
            }
            
            var btn,
                index,
                fbar = this.child("[ui='footer']"),
                dbtn = this.defaultButton;

            if (!dbtn) {
                if (!(this instanceof Ext.form.Panel) || !fbar || !fbar.items || !(fbar.items.last() instanceof Ext.button.Button) || Ext.fly(target).hasCls(Ext.button.Button.prototype.baseCls)) {
                    return;
                }   

                btn = fbar.items.last();
                this.clickButton(btn, e);

                return;
            }            

            if (Ext.isNumeric(dbtn)) {
                index = parseInt(dbtn, 10);

                if (!fbar || !fbar.items || !(fbar.items.getAt(index) instanceof Ext.button.Button)) {
                    return;
                }  

                btn = fbar.items.getAt(index);
                this.clickButton(btn, e);
            } else {            
                btn = Ext.getCmp(dbtn);   

                if (!btn) {
                    btn = this.down(dbtn);
                }

                if (btn) {
                    this.clickButton(btn, e);
                }
            }
        }
    },

    clickButton : function (btn, e) {        
        if(this.defaultButtonStopEvent !== false) {
            e.stopEvent();
        }
        if (btn.onClick) {
            e.button = 0;
            btn.onClick(e);
        } else {
            btn.fireEvent("click", btn, e);
        }
    },
	
	beforeWindowUnload: function () {
        var me = this,
            doc, prop;

        if (me.rendered) {
            try {
                doc = me.getDoc();
                if (doc) {
                    if (!Ext.isIE) {
                        Ext.EventManager.removeAll(doc);
                    }
                    for (prop in doc) {
                        if (doc.hasOwnProperty && doc.hasOwnProperty(prop)) {
                            delete doc[prop];
                        }
                    }
                }
            } catch(e) { }
        }
    }, 

    onIFrameLoad: function () {
        var me = this,
            doc = me.getDoc(),
            fn = me.onIFrameRelayedEvent;

        if (doc) {
            if (!Ext.isIE) {
                try {
                    Ext.EventManager.removeAll(doc); 

                    Ext.EventManager.on(doc, {
                        mousedown: fn, 
                        mousemove: fn, 
                        mouseup: fn,   
                        click: fn,     
                        dblclick: fn,  
                        scope: me
                    });
                } catch(e) {                
                }
            }
            
            if (!this._unloadListener) {
                this._unloadListener = true;
                Ext.EventManager.on(window, 'unload', me.beforeWindowUnload, me);
            }
        }
    },

    onIFrameRelayedEvent: function (event) {
        if (!this.iframe) {
            return;
        }

        var iframeEl = this.iframe,
            iframeXY = Ext.Element.getTrueXY(iframeEl),
            originalEventXY = event.getXY(),
            eventXY = Ext.EventManager.getPageXY(event.browserEvent);

        event.xy = [iframeXY[0] + eventXY[0], iframeXY[1] + eventXY[1]];

        event.injectEvent(iframeEl);

        event.xy = originalEventXY;
    },

    getFrameBody: function () {
        var doc = this.getDoc();
        return doc.body || doc.documentElement;
    },

    getDoc: function () {
        try {
            return this.getWin().document;
        } catch (ex) {
            return null;
        }
    },

    getWin: function () {
        var me = this,
            name = me.id + "_IFrame",
            win = Ext.isIE
                ? me.iframe.dom.contentWindow
                : window.frames[name];
        return win;
    },

    getFrame: function () {
        var me = this;
        return me.iframe.dom;
    }
});