
// @source core/utils/Element.js

Ext.dom.Element.override({
    singleSelect : function (selector, unique) {
        return Ext.get(Ext.select(selector, unique).elements[0]);
    },
    
    setValue : function (val) {
        if (Ext.isDefined(this.dom.value)) {
            this.dom.value = val;
        }
        
        return this;
    },
    
    getValue : function () {
        return Ext.isDefined(this.dom.value) ? this.dom.value : null;
    },
    
    removeAttribute: function (attr) { 
        this.dom.removeAttribute(attr);
    },

    removeStyleProperty: function (prop) {
        this.dom.style[Ext.isIE8m ? "removeAttribute" : "removeProperty"](prop);
    },

    getById : function (id, asDom) {
        if (Ext.isEmpty(id)) {
            return null;
        }

        return this.callParent(arguments);
    }
});