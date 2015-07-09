
Ext.view.AbstractView.override({
     initComponent : Ext.Function.createSequence(Ext.view.AbstractView.prototype.initComponent, function () {
         this.addEvents('beforeitemupdate', 'beforeitemremove');
     }),
     
     onUpdate : Ext.Function.createInterceptor(Ext.view.AbstractView.prototype.onUpdate, function (ds, record) {
           var me = this,
            index = me.store.indexOf(record);
            
           me.fireEvent('beforeitemupdate', me, record, index);
     }),
     
     onRemove : Ext.Function.createInterceptor(Ext.view.AbstractView.prototype.onRemove, function (ds, records, indexes) {
           var i;
           for (i = indexes.length - 1; i >= 0; --i) {
               this.fireEvent('beforeitemremove', this, records[i], indexes[i]);
           }           
     })
});