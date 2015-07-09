
// @source core/utils/Observable.js

// Private Destroyable class which removes listeners
Ext.net.ListenerRemover = function(observable) {

    // Passed a ListenerRemover: return it
    if (observable instanceof Ext.net.ListenerRemover) {
        return observable;
    }

    this.observable = observable;

    // Called when addManagedListener is used with the event source as the second arg:
    // (owner, eventSource, args...)
    if (arguments[1].isObservable) {
        this.managedListeners = true;
    }
    this.args = Ext.Array.slice(arguments, 1);
};

Ext.net.ListenerRemover.prototype.destroy = function() {
    this.observable[this.managedListeners ? 'mun' : 'un'].apply(this.observable, this.args);
};

Ext.util.Observable.override({
    constructor : function (config) {
        this.callParent(arguments);

        this.directListeners = this.directListeners || {};
        this.hasDirectListeners = this.hasDirectListeners || {};
        
        if (Ext.net && Ext.net.MessageBus) {
            Ext.net.MessageBus.initEvents(this);
        }
    }
});

Ext.net._supportsAddEventListener = !Ext.isIE9 && 'addEventListener' in document;
Ext.EventManager.removeListener = function(element, eventName, fn, scope) {
    // handle our listener config object syntax
    if (typeof eventName !== 'string') {
        Ext.EventManager.prepareListenerConfig(element, eventName, true);
        return;
    }

    var dom = Ext.getDom(element),
        id, el = element.dom ? element : Ext.get(dom),
        cache = Ext.EventManager.getEventListenerCache(el, eventName),
        bindName = Ext.EventManager.normalizeEvent(eventName).eventName,
        i = cache.length, j, cacheItem, hasRemoveEventListener,
        listener, wrap;

    if (!dom) {
        return;
    }

    // In IE9 we prefer to use detachEvent but it's not available for some Elements (SVG)
    hasRemoveEventListener = Ext.net._supportsAddEventListener || (Ext.isIE9 && !dom.detachEvent);
            
    if (typeof fn === 'string') {
        fn = Ext.resolveMethod(fn, scope || element);
    }

    while (i--) {
        listener = cache[i];

        if (listener && (!fn || listener.fn == fn) && (!scope || listener.scope === scope)) {
            wrap = listener.wrap;

            // clear buffered calls
            if (wrap.task) {
                clearTimeout(wrap.task);
                delete wrap.task;
            }

            // clear delayed calls
            j = wrap.tasks && wrap.tasks.length;
            if (j) {
                while (j--) {
                    clearTimeout(wrap.tasks[j]);
                }
                delete wrap.tasks;
            }

            if (!hasRemoveEventListener) {
                // if length is 1, we're removing the final event, actually
                // unbind it from the element
                id = Ext.EventManager.normalizeId(dom, true);
                cacheItem = Ext.cache[id][bindName];
                if (cacheItem && cacheItem.firing) {
                    // See code in addListener for why we create a copy
                    cache = Ext.EventManager.cloneEventListenerCache(dom, bindName);
                }
                        
                if (cache.length === 1) {
                    fn = cacheItem.fn;
                    delete Ext.cache[id][bindName];
                    dom.detachEvent('on' + bindName, fn);
                }
            } else if (dom.removeEventListener) {
                dom.removeEventListener(bindName, wrap, listener.capture);
            }

            if (wrap && dom == document && eventName == 'mousedown') {
                Ext.EventManager.stoppedMouseDownEvent.removeListener(wrap);
            }

            // remove listener from cache
            Ext.Array.erase(cache, i, 1);
        }
    }
};

Ext.EventManager.un = Ext.EventManager.removeListener;

Ext.util.DirectObservable = {
    initDirectEvents : function () {
        if (!this.directListeners) {
            this.directListeners = {};
        }

        if (!this.hasDirectListeners) {
            this.hasDirectListeners = {};
        }
        
        if (!this.isDirectInit) {
            this.isDirectInit = true;            

            if (this.directEvents) {
                this.addDirectListener(this.directEvents);
                this.directEvents = null;
            }
        }
    },
    
    fireEvent: function (eventName) {
        this.initDirectEvents();
        return this.fireEventArgs(eventName, Array.prototype.slice.call(arguments, 1));
    },

    fireEventArgs: function(eventName, args) {
        eventName = eventName.toLowerCase();
        var me = this,
            events = me.events,
            directListeners = me.directListeners,
            event = events && events[eventName],
            directListener = directListeners && directListeners[eventName];
            ret = true;

        // Only continue firing the event if there are listeners to be informed.
        // Bubbled events will always have a listener count, so will be fired.
        if ((event || directListener) && (me.hasListeners[eventName] || me.hasDirectListeners[eventName])) {
            ret = me.continueFireEvent(eventName, args || emptyArray, (event || directListener).bubble);
        }
        return ret;
    },

    continueFireEvent: function (eventName, args, bubbles) {
        var target = this,
            queue, event,
            ret = true;

        do {
            if (target.eventsSuspended) {
                if ((queue = target.eventQueue)) {
                    queue.push([eventName, args, bubbles]);
                }

                return ret;
            } else {
                event = target.events[eventName];

                if (event && event != true) {
                    if ((ret = event.fire.apply(event, args)) === false) {
                        break;
                    }
                }

                target.initDirectEvents();

                event = target.directListeners[eventName];
                if (event && event != true) {
                    if ((ret = event.fire.apply(event, args)) === false) {
                        break;
                    }
                }
            }
        } while (bubbles && (target = target.getBubbleParent()));
        return ret;
    },

    addListener : function (ename, fn, scope, options) {
        var me = this,
            config, 
            event, 
            hasListeners,
            prevListenerCount = 0;

        if (!me.hasListeners) {
            me.hasListeners = new me.HasListeners();
        } 

        if (this instanceof Ext.AbstractComponent) {
            var element = ename, 
                listeners = fn;

            if (Ext.isString(element) && (Ext.isObject(listeners) || options && options.element)) {
                if (options.element) {
                    fn = listeners;

                    listeners = {};
                    listeners[element] = fn;
                    element = options.element;
                    if (scope) {
                        listeners.scope = scope;
                    }

                    for (option in options) {
                        if (options.hasOwnProperty(option)) {
                            if (me.eventOptionsRe.test(option)) {
                                listeners[option] = options[option];
                            }
                        }
                    }
                }

                // At this point we have a variable called element,
                // and a listeners object that can be passed to on
                if (me[element] && me[element].on) {
                    me.mon(me[element], listeners);
                } else {
                    me.afterRenderEvents = me.afterRenderEvents || {};
                    if (!me.afterRenderEvents[element]) {
                        me.afterRenderEvents[element] = [];
                    }
                    me.afterRenderEvents[element].push(listeners);
                }

                return;
            }

            ename = element;
            fn = listeners;
        }

        if (typeof ename !== 'string') {
            options = ename;

            for (ename in options) {
                if (options.hasOwnProperty(ename)) {
                    config = options[ename];
            
                    if (!me.eventOptionsRe.test(ename)) {
                        me.addListener(ename, (config.fn || config.broadcastOnBus) ? config.fn : config, config.scope || options.scope, (config.fn || config.broadcastOnBus) ? config : options);
                    }
                }                
            }

            if (options && options.destroyable) {
                return new Ext.net.ListenerRemover(me, options);
            }
        } else {
            ename = ename.toLowerCase();
            event = me.events[ename];

            if (event && event.isEvent) {
                prevListenerCount = event.listeners.length;
            } else {
                me.events[ename] = event = new Ext.util.Event(me, ename);
            }

            if (fn) {
                if (typeof fn === 'string') {
                    scope = scope || me;
                    fn = Ext.resolveMethod(fn, scope);
                }
                
                event.addListener(fn, scope, options);

                if (event.listeners.length !== prevListenerCount) {
                    hasListeners = me.hasListeners;

                    me.hasListeners._incr_(ename);
                }
                if (options && options.destroyable) {
                    return new Ext.net.ListenerRemover(me, ename, fn, scope, options);
                }
            }

            if (options && options.broadcastOnBus) {
                var parts = options.broadcastOnBus.split(":"),
                    bus,
                    name;

                if (parts.length == 1) {
                    bus = Ext.net.Bus;
                    name = parts[0];
                } else {
                    bus = Ext.net.ResourceMgr.getCmp(parts[0]);
                    name = parts[1];
                }

                fn = Ext.Function.bind(function () {
                    var bus = arguments[arguments.length-2],
                        name = arguments[arguments.length-1],
                        options = arguments[arguments.length-3],
                        data = arguments,
                        i,
                        len;

                    if (options.argumentsList) {
                        data = {};

                        for (i = 0, len = options.argumentsList.length; i < len; i++) {
                            data[options.argumentsList[i]] = arguments[i];
                        }
                    }

                    bus.publish(name, data);
                }, this, [bus, name], true);
                
                event.addListener(fn, scope, Ext.isObject(options) ? options : {});
                me.hasListeners[ename] = (me.hasListeners[ename]||0) + 1;
            }
        }
    },

    addDirectListener : function (ename, fn, scope, options) {
        var me = this,
            config, 
            event, 
            hasListeners,
            hasDirectListeners,
            prevListenerCount = 0;

        if (!me.hasListeners) {
            me.hasListeners = new me.HasListeners();
        }

        if (!this.directListeners) {
            this.directListeners = {};
        }

        if (!this.hasDirectListeners) {
            this.hasDirectListeners = {};
        }

        if (typeof ename !== 'string') {
            options = ename;

            for (ename in options) {
                if (options.hasOwnProperty(ename)) {
                    config = options[ename];
          
                    if (!me.eventOptionsRe.test(ename)) {
                        me.addDirectListener(ename, config.fn || config, config.scope || options.scope, config.fn ? config : options);
                    }
                }
            }
          
            if (options && options.destroyable) {
                return new Ext.net.ListenerRemover(me, ename, fn, scope, options);
            }
        } else {
            ename = ename.toLowerCase();
            event = me.directListeners[ename];

            if (event && event.isEvent) {
                prevListenerCount = event.listeners.length;
            } else {
                me.directListeners[ename] = event = new Ext.util.Event(me, ename);
            }

            if (typeof fn === 'string') {
                 scope = scope || me;
                 fn = Ext.resolveMethod(fn, scope);
            }

            options = Ext.isObject(options) ? options : {};

            if (!Ext.isDefined(options.delay)) {
                options.delay = 20;
            }

            if (options.delay <= 0) {
                delete options.delay;
            }
			
            event.addListener(fn, scope, options);

            event.addListener(fn, scope, options);

            if (event.listeners.length !== prevListenerCount) {
                hasListeners = me.hasListeners;

                if (hasListeners.hasOwnProperty(ename)) {
                    ++hasListeners[ename];
                } else {
                    hasListeners[ename] = 1;
                }

                hasDirectListeners = me.hasDirectListeners;

                if (hasDirectListeners.hasOwnProperty(ename)) {
                    ++hasDirectListeners[ename];
                } else {
                    hasDirectListeners[ename] = 1;
                }
            }

            if (options && options.destroyable) {
                return new Ext.net.ListenerRemover(me, ename, fn, scope, options);
            }
        }
    },

    removeDirectListener : function (name) {
        if (this.directListeners) {
            var event = this.directListeners[name];
            if (event && this.hasDirectListeners[name]) {
                delete this.hasDirectListeners[name];
                event.clearListeners();
            }
        }
    },

    suspendEvent: function(eventName) {
        var len = arguments.length,
            i, event;

        for (i = 0; i < len; i++) {
            event = this.events[arguments[i]];

            // If it exists, and is an Event object (not still a boolean placeholder), suspend it
            if (event && event.suspend) {
                event.suspend();
            }

            event = this.directListeners[arguments[i]];
            if (event && event.suspend) {
                event.suspend();
            }
        }
    },

    resumeEvent: function() {
            var len = arguments.length,
            i, event;

        for (i = 0; i < len; i++) {

            // If it exists, and is an Event object (not still a boolean placeholder), resume it
            event = this.events[arguments[i]];
            if (event && event.resume) {
                event.resume();
            }

            event = this.directListeners[arguments[i]];
            if (event && event.resume) {
                event.resume();
            }
        }
    },

    clearListeners: function() {
        var events = this.events,
            directListeners = this.directListeners,
            hasListeners = this.hasListeners,
            hasDirectListeners = this.hasDirectListeners,
            event,
            key;

        for (key in events) {
            if (events.hasOwnProperty(key)) {
                event = events[key];
                if (event.isEvent) {
                    delete hasListeners[key];
                    event.clearListeners();
                }
            }
        }

        for (key in directListeners) {
            if (directListeners.hasOwnProperty(key)) {
                event = directListeners[key];
                if (directListeners.isEvent) {
                    delete hasDirectListeners[key];
                    event.clearListeners();
                }
            }
        }

        this.clearManagedListeners();
    }
};

Ext.Component.prototype.fireEventArgs = function(ev, args) {
    var ret = Ext.util.DirectObservable.fireEventArgs.apply(this, arguments);

    if (ret !== false) {
        ret = Ext.app.domain.Component.dispatch(this, ev, args);
    }

    return ret;
};