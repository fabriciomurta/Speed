/*
 * @version   : 2.3.1 - Ext.NET Pro License
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2013-10-17
 * @copyright : Copyright (c) 2007-2013, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : See license.txt and http://www.ext.net/license/. 
 * @website   : http://www.ext.net/
 */


Ext.define('Ext.ux.SlidingPager',{requires:['Ext.slider.Single','Ext.slider.Tip'],constructor:function(config){if(config){Ext.apply(this,config);}},init:function(pbar){var idx=pbar.items.indexOf(pbar.child("#inputItem")),slider;Ext.each(pbar.items.getRange(idx-2,idx+2),function(c){c.hide();});slider=Ext.create('Ext.slider.Single',{width:114,minValue:1,maxValue:1,hideLabel:true,tipText:this.getTipText||function(thumb){return Ext.String.format('Page <b>{0}</b> of <b>{1}</b>',thumb.value,thumb.slider.maxValue);},listeners:{changecomplete:function(s,v){pbar.store.loadPage(v);}}});pbar.insert(idx+1,slider);pbar.on({change:function(pb,data){slider.setMaxValue(data.pageCount);slider.setValue(data.currentPage);}});}});
