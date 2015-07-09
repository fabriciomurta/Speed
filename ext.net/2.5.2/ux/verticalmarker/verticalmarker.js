/*
 * @version   : 2.5.2 - Ext.NET Pro License
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2014-05-22
 * @copyright : Copyright (c) 2008-2014, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : See license.txt and http://www.ext.net/license/.
 */


Ext.define("Ext.net.VerticalMarker",{extend:'Ext.util.Observable',alias:"plugin.verticalmarker",xLabelCls:"x-vmarker-xfieldlabel",yLabelCls:"x-vmarker-yfieldlabel",snap:false,showXLabel:true,buffer:0,constructor:function(config){Ext.apply(this,config);this.addEvents("labelsready");this.callParent(arguments);},init:function(chart){var me=this;me.chart=chart;if(chart.rendered){me.initialize();}else{me.chart.on("afterrender",me.initialize,me,{single:true,delay:500});}},initialize:function(){var me=this;if(me.disabled){return;}
me.chart.on({mousemove:me.onMouseMove,mouseleave:me.onMouseLeave,scope:me});me.markerSprite=me.chart.surface.add(Ext.apply({type:'path',path:['M',0,0],zIndex:1001,opacity:0.6,hidden:true,stroke:'#00f',cursor:'crosshair'},me.markerConfig||{}));me.chart.redraw=Ext.Function.createSequence(me.chart.redraw,function(){me.hideVisibleStuff();},me);},initLabels:function(){if(this.labels){return;}
var me=this,seriesItems=me.chart.series.items,series,i,len;me.xFieldLabel=new Ext.Component({floating:true,cls:this.xLabelCls});me.labels=[];for(i=0,ln=seriesItems.length;i<ln;i++){series=seriesItems[i];me.labels.push(new Ext.Component({floating:true,style:"background-color: "+series.getLegendColor()+";",renderTo:document.body,hidden:true,cls:this.yLabelCls}));}
if(me.buffer>0){me.eArg=[{getXY:Ext.Function.bind(me.eGetXY,me),getPageX:Ext.Function.bind(me.eGetPageX,me)}];}
this.fireEvent("labelsready",this);},onMouseMove:function(e){var me=this,position=me.chart.getEventXY(e),bbox=me.chart.bbox||me.chart.chartBBox,seriesItems=me.chart.series.items,label,x=bbox.x,y=bbox.y,height=Math.floor(y+bbox.height),width=Math.floor(x+bbox.width),staticX=e.getPageX()-me.chart.el.getX(),staticY=y,series,item,items,nearestItem,nearestX,minDist,i,ln,xy,lastItemFound=false,surfaceExt=Ext.get(me.chart.surface.getId()),surfacePosition=surfaceExt.getXY(),sprite,path;staticX=Math.min(Math.max(staticX,x),width);me.initLabels();if(me.buffer<=0||((new Date().getTime()-(me.lastTime||0))>me.buffer)){me.lastTime=new Date().getTime();if(me.updateTask){me.updateTask.cancel();}
items=[];minDist=10000;for(i=0,ln=seriesItems.length;i<ln;i++){series=seriesItems[i];label=me.labels[i];item=me.getItemForX(series,position[0]);items.push(item);if(item&&item.dist<minDist){nearestItem=item;minDist=item.dist;nearestX=item.item.storeItem.get(series.xField);}}
for(i=0,ln=seriesItems.length;i<ln;i++){item=items[i];if(item&&item.item.storeItem.get(seriesItems[i].xField)!==nearestX){items[i]=null;}}
for(i=0,ln=seriesItems.length;i<ln;i++){series=seriesItems[i];label=me.labels[i];item=items[i];if(item){if(!me.lastItem||me.lastItem.item.storeItem.id!=item.item.storeItem.id){me.labelXAdj=0;lastItemFound=true;me.lastItem=item;me.lastField=series.xField;}
else if(!lastItemFound){continue;}
sprite=item.item.sprite;if(sprite&&sprite.attr){x=surfacePosition[0]+(sprite.attr.x||0)+(sprite.attr.translation&&sprite.attr.translation.x||0);y=surfacePosition[1]+(sprite.attr.y||0)+(sprite.attr.translation&&sprite.attr.translation.y||0);}
else{x=surfacePosition[0]+parseInt(item.item.point[0],10);y=surfacePosition[1]+parseInt(item.item.point[1],10);}
if(me.snap){staticX=x-me.chart.el.getX();}
label.show();if(me.yLabelRenderer){me.updateLabel(label,me.yLabelRenderer.call(me.yLabelScope||me,me,label,item.item.storeItem.get(series.yField),item.item.storeItem,series.yField,series));}
else{me.updateLabel(me.labels[i],item.item.storeItem.get(series.yField));}
label.el.setXY(me.checkY(i,x+5,y),false);}
else{label.hide();}}}
else if(me.buffer>0){if(!me.updateTask){me.updateTask=new Ext.util.DelayedTask(function(e){this.onMouseMove(e);},me);}
me._eXY=e.getXY();me._ePageX=e.getPageX();me.updateTask.delay(me.buffer,undefined,undefined,me.eArg);}
path=['M',staticX,staticY,'L',staticX,height];if(!me.snap||lastItemFound){me.markerSprite.setAttributes({path:path,'stroke-width':1,hidden:false},true);}
if(lastItemFound&&me.showXLabel){me.xFieldLabel.show();if(me.xLabelRenderer){me.updateLabel(me.xFieldLabel,me.xLabelRenderer.call(me.xLabelScope||me,me,me.xFieldLabel,me.lastItem.item.storeItem.get(me.lastField),me.lastItem.item.storeItem,me.lastField));}
else{me.updateLabel(me.xFieldLabel,me.lastItem.item.storeItem.get(me.lastField));}}
if((!me.snap||lastItemFound)&&me.showXLabel){x=surfacePosition[0]+staticX;y=surfacePosition[1]+height;me.xFieldLabel.el.moveTo(x-me.xFieldLabel.getWidth()/2,y,false);}},updateLabel:function(el,value){if(!Ext.isString(value)&&!Ext.isEmpty(value)){value=value.toString();}
el.update(value);},eGetXY:function(){return this._eXY;},eGetPageX:function(){return this._ePageX;},checkY:function(ind,x,y){var me=this,i,box,height=me.labels[ind].getHeight(),t,b;y=y-height/2;for(i=0;i<ind;i++){if(me.labels[i].rendered){box=me.labels[i].getBox();t=Math.max(y,box.y);b=Math.min(y+height,box.y+box.height);if(b>t){me.labelXAdj=me.labelXAdj+box.width+2;y=box.y;x=x+me.labelXAdj;break;}}}
return[x,y];},withinBoxX:function(x,box){box=box||{};return x>=box.x&&x<=(box.x+box.width);},getItemForX:function(series,x){if(!series.items||!series.items.length||series.seriesIsHidden){return null;}
var me=this,items=series.items,bbox=series.bbox,foundItem=items[0],foundDist=10000,item,dist,lastItem=items[items.length-1],i,ln;for(i=0,ln=items.length;i<ln;i++){item=items[i];if(item){dist=Math.abs(item.point[0]-x);if(dist>foundDist){return{item:foundItem,i:i,dist:foundDist,length:items.length};}
foundDist=dist;foundItem=item;}}
return{item:foundItem,dist:foundDist,i:items.length-1,length:items.length};},onMouseLeave:function(e){this.hideVisibleStuff();},hideVisibleStuff:function(){var me=this;if(me.updateTask){me.updateTask.cancel();}
if(me.markerSprite){me.markerSprite.hide(true);}
if(me.xFieldLabel){me.xFieldLabel.hide();}
delete me.lastItem;if(me.labels){for(var i=0,ln=me.labels.length;i<ln;i++){me.labels[i].rendered&&me.labels[i].hide();}}},disable:function(){var me=this;if(me.disabled===true){return;}
if(me.updateTask){me.updateTask.cancel();}
me.chart.un({mousemove:me.onMouseMove,mouseleave:me.onMouseLeave,scope:me});me.hideVisibleStuff();me.disabled=true;},enable:function(){var me=this;if(me.disabled===true){me.disabled=false;me.initialize();}},destroy:function(){var me=this,i,ln;if(me.xFieldLabel){me.xFieldLabel.destroy();}
if(me.labels){for(i=0,ln=me.labels.length;i<ln;i++){me.labels[i].destroy();}}
this.callParent(arguments);}});
