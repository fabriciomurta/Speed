
// @source core/AbstractComponent.js

Ext.override(Ext.AbstractComponent, {
    selectable      : true,    
    autoFocusDelay  : 10,

    initComponent : function () {
        if (this.hasId()) {
            var cmp = Ext.getCmp(this.id);
            if (cmp) {
                cmp.destroy();
            }
        }
        
        if (this.contentHtml && Ext.isFunction(this.contentHtml)) {
            this.contentHtml.call(window);
        }
        
        if (this.preinitFn) {
            this.preinitFn.call(this.preinitScope || this, this);
        }

        if (this.tag) {
            this.setTag(this.tag);
        }
        
        Ext.net.ComponentManager.registerId(this);        
        
        this.callParent(arguments);
    },

    hasId : function () {
        return !!(this.initialConfig && this.initialConfig.id);
    },
    
    destroy : function () {
        this.destroyBin();
        this.callParent(arguments);
    },
    
    destroyBin : function () {
		if (this.bin) {
		    Ext.destroy(this.bin);
		}

		delete this.bin;
	},    
    
    setSelectable : function (selectable) {
        if (selectable === false) {
            this.setDisabled(true).el.removeCls("x-item-disabled").applyStyles("color:black;");
        } else if (selectable === true) {
            this.setDisabled(false);
        }
        
        this.selectable = false;
        
        return this;
    },
    
    addPlugins : function (plugins) {
        if (Ext.isEmpty(this.plugins)) {
            this.plugins = [];
        } else if (!Ext.isArray(this.plugins)) {
            this.plugins = [ this.plugins ];
        }
        
        if (Ext.isArray(plugins)) {
            for (var i = 0; i < plugins.length; i++) {
                this.plugins.push(this.initPlugin(plugins[i]));
            }
        } else {
            this.plugins.push(this.initPlugin(plugins));
        }
    },
    
    getForm : function (id) {
        var form = Ext.isEmpty(id) ? this.el.up("form") : Ext.get(id);
        
        if (!Ext.isEmpty(form)) {
            Ext.apply(form, form.dom);
            
            form.submit = function () {
                form.dom.submit();
            };
        }
        
        return form;
    },
    
    setAnchor : function (anchor, doLayout) {
        this.anchor = anchor;
        delete this.anchorSpec;
        
        if (doLayout && this.ownerCt) {
            this.ownerCt.doLayout();
        }
    },
    
    getLoader : function () {
        var me = this,
            autoLoad = me.autoLoad ? (Ext.isObject(me.autoLoad) ? me.autoLoad : {url: me.autoLoad}) : null,
            loader = me.loader || autoLoad;

        if (loader) {
            if (!loader.isLoader) {
                me.loader = Ext.create('Ext.net.ComponentLoader', Ext.apply({
                    target: me,
                    autoLoad: autoLoad
                }, loader));
            } else {
                loader.setTarget(me);
            }

            return me.loader;

        }

        return null;
    },
    
    getTagHiddenField : function () {
         if (!this.tagHiddenField && (this.hasId() || this.tagHiddenName)) {
            this.tagHiddenField = new Ext.form.Hidden({ 
                name : this.tagHiddenName || (this.id + "_tag") 
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.tagHiddenField);

            this.on("afterrender", function () {
                this.tagHiddenField.render(this.el.parent() || this.el);
            }, this, {single:true});
        }
        return this.tagHiddenField;
    },

    setTag : function (tag) {
        var field = this.getTagHiddenField();

        if (field) {
            field.setValue(Ext.util.Format.htmlEncode(Ext.isString(tag) ? tag : Ext.encode(tag)));
        }
        this.tag = tag;
    },

    getTag : function () {
        return this.tag;
    },

    replace : function (cmp) {
        if (this.ownerCt) {
            var index = this.ownerCt.items.indexOf(this),
                ct = this.ownerCt;

            ct.remove(this, true);
            
            if (Ext.isFunction(cmp)) {
                cmp({ mode : "item", index : index, ct : ct });
            } else {
                ct.insert(index, cmp);
            }
        } else {
            var container = this.el.dom.parentNode,
                position = this.el.next();

            this.destroy();

            if (Ext.isFunction(cmp)) {
                cmp({mode : "el", position : position, ct : container });
            } else {
                cmp = Ext.ComponentManager.create(cmp);
                cmp.render(container, position);
            }            
        }
    }
});