
// @source core/utils/Element.js

Ext.core.Element.addMethods({
    addKeyListenerEx : function (key, fn, scope) {
        this.addKeyListener(key, fn || key.fn, scope || key.scope);
        return this;
    },
    
    initDDEx : function (group, config, overrides) {
        this.initDD(group, config, overrides);
        return this;
    },
    
    initDDProxyEx : function (group, config, overrides) {
        this.initDDProxy(group, config, overrides);
        return this;
    },

    initDDTargetEx : function (group, config, overrides) {
        this.initDDTarget(group, config, overrides);
        return this;
    },
    
    positionEx : function (pos, zIndex, x, y) {
        this.position(pos, zIndex, x, y);
        return this;
    },
    
    relayEventEx : function (eventName, observable) { 
        this.relayEvent(eventName, observable);
        return this;
    },
    
    scrollEx : function (direction, distance, animate) {
        this.scroll(direction, distance, animate);
        return this;
    },
    
    unmaskEx : function () {
        this.unmask();
        return this;
    },
    
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
    }
});

if (!Ext.isIE && document.querySelector) {
    Ext.core.Element.prototype.getById = function (id, asDom) {
        if (Ext.isEmpty(id)) {
            return null;
        }
        var dom = document.getElementById(id) ||
            this.dom.querySelector('#'+Ext.escapeId(id));
        return asDom ? dom : (dom ? Ext.get(dom) : null);
    };
}

Ext.dom.Element.override({
    // The fix for http://forums.ext.net/showthread.php?27662
    isFocusable: function (asFocusEl) {
        var dom = this.dom,
            tabIndexAttr = dom && dom.getAttributeNode && dom.getAttributeNode('tabIndex'),
            focusRe = /^a|button|embed|iframe|input|object|select|textarea$/i,
            tabIndex,
            nodeName = dom.nodeName,
            canFocus = false;

        if (tabIndexAttr && tabIndexAttr.specified) {
            tabIndex = tabIndexAttr.value;
        }

        if (dom && !dom.disabled) {
            if (tabIndex == -1) {
                canFocus = Ext.FocusManager && Ext.FocusManager.enabled && asFocusEl;
            } else {
                if (focusRe.test(nodeName)) {
                    if ((nodeName !== 'a') || dom.href) {
                        canFocus = true;
                    }
                } else {
                    canFocus = tabIndex != null && tabIndex >= 0;
                }
            }

            canFocus = canFocus && this.isVisible(true);
        }

        return canFocus;
    },

    // The fix for the GitHub issue #334
    scroll: function (direction, distance, animate) { 
        if (!this.isScrollable()) {
            return false;
        }

        direction = direction.charAt(0);

        var me = this,
            dom = me.dom,
            side = direction === 'r' || direction === 'l' ? 'left' : 'top',
            scrolled = false,
            currentScroll, constrainedScroll;

        if (direction === 'l' || direction === 't' || direction === 'u') {
            distance = -distance;
        }

        if (side === 'left') {
            currentScroll = dom.scrollLeft;
            constrainedScroll = me.constrainScrollLeft(currentScroll + distance);
        } else {
            currentScroll = dom.scrollTop;
            constrainedScroll = me.constrainScrollTop(currentScroll + distance);
        }

        if (constrainedScroll !== currentScroll) {
            this.scrollTo(side, constrainedScroll, animate);
            scrolled = true;
        }

        return scrolled;
    }
    // The fix for the GitHub issue #334
});