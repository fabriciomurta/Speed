/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('Ext.ux.desktop.Module', {
    mixins: {
        observable: 'Ext.util.Observable'
    },

    constructor: function (config) {
        this.mixins.observable.constructor.call(this, config);
        this.init();
    },    

    init: Ext.emptyFn,
    /*---ADDED---*/
    createWindow : function (config) {
        if(!this.window){
            return;
        }
        
        var desktop = this.app.getDesktop(),
            win = desktop.getModuleWindow(this.id),     
            wndCfg,       
            isReopen = !win && this.win;        

        win = win || this.win;

        if(!win){            
            wndCfg = this.window.call(window) || this._window;
            
            if(config){
                wndCfg = Ext.apply(wndCfg, config);
            }
            
            win = desktop.createWindow(wndCfg);
            win.moduleId = this.id;
            if(win.closeAction === "hide"){
                this.win = win;
                win.on("destroy", function () {
                    delete this.win;
                }, this);
            }
        }

        if(isReopen){
            desktop.windows.add(win);

            win.taskButton = desktop.taskbar.addTaskButton(win);
            win.animateTarget = win.taskButton.el;
        }        
        win.show();
        return win;
    },

    addWindow: function (window) {
        this.window = window;
        if(this.autoRun && !this.autoRunHandler){
            this.createWindow();
        }
    },

    setWindow : function (window) {
        this._window = window;
    },

    addLauncher : function (launcher) {
        this.launcher = launcher;

        if(!(this.launcher.handler || this.launcher.listeners && this.launcher.listeners.click)){
            this.launcher.handler = function() {
                this.createWindow();
            };
            this.launcher.scope = this;                
        }
        this.launcher.moduleId = this.id;
        this.app.desktop.taskbar.startMenu.menu.add(this.launcher);
    },

    run : function () {
        return this.createWindow();
    }
    /*---END---*/
});
