/*
 * @version   : 2.4.0 - Ext.NET Pro License
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2013-12-03
 * @copyright : Copyright (c) 2007-2013, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : See license.txt and http://www.ext.net/license/. 
 * @website   : http://www.ext.net/
 */


Ext.define('Ext.ux.DataView.Draggable',{requires:'Ext.dd.DragZone',ghostCls:'x-dataview-draggable-ghost',ghostTpl:['<tpl for=".">','{title}','</tpl>'],constructor:function(config){Ext.apply(this,config||{});},init:function(dataview){this.dataview=dataview;dataview.on('render',this.onRender,this);Ext.apply(this,{itemSelector:dataview.itemSelector,ghostConfig:{}});Ext.applyIf(this.ghostConfig,{itemSelector:'img',cls:this.ghostCls,tpl:this.ghostTpl});},onRender:function(){var config=Ext.apply({},this.ddConfig||{},{dvDraggable:this,dataview:this.dataview,getDragData:this.getDragData,getTreeNode:this.getTreeNode,afterRepair:this.afterRepair,getRepairXY:this.getRepairXY});this.dragZone=Ext.create('Ext.dd.DragZone',this.dataview.getEl(),config);},getDragData:function(e){var draggable=this.dvDraggable,dataview=this.dataview,selModel=dataview.getSelectionModel(),target=e.getTarget(draggable.itemSelector),selected,dragData;if(target){if(!dataview.isSelected(target)){selModel.select(dataview.getRecord(target));}
selected=dataview.getSelectedNodes();dragData={copy:true,nodes:selected,records:selModel.getSelection(),item:true};if(selected.length==1){dragData.single=true;dragData.ddel=target;}else{dragData.multi=true;dragData.ddel=draggable.prepareGhost(selModel.getSelection()).dom;}
return dragData;}
return false;},getTreeNode:function(){},afterRepair:function(){this.dragging=false;var nodes=this.dragData.nodes,length=nodes.length,i;for(i=0;i<length;i++){Ext.get(nodes[i]).frame('#8db2e3',1);}},getRepairXY:function(e){if(this.dragData.multi){return false;}else{var repairEl=Ext.get(this.dragData.ddel),repairXY=repairEl.getXY();repairXY[0]+=repairEl.getPadding('t')+repairEl.getMargin('t');repairXY[1]+=repairEl.getPadding('l')+repairEl.getMargin('l');return repairXY;}},prepareGhost:function(records){var ghost=this.createGhost(records),store=ghost.store;store.removeAll();store.add(records);return ghost.getEl();},createGhost:function(records){if(!this.ghost){var ghostConfig=Ext.apply({},this.ghostConfig,{store:Ext.create('Ext.data.Store',{model:records[0].modelName})});this.ghost=Ext.create('Ext.view.View',ghostConfig);this.ghost.render(document.createElement('div'));}
return this.ghost;}});
