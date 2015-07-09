/*
 * @version   : 2.5.0 - Ext.NET Pro License
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2014-03-04
 * @copyright : Copyright (c) 2008-2014, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : See license.txt and http://www.ext.net/license/. 
 * @website   : http://www.ext.net/
 */


Ext.define('Ext.ux.CellDragDrop',{extend:'Ext.AbstractPlugin',alias:'plugin.celldragdrop',uses:['Ext.view.DragZone'],enforceType:false,applyEmptyText:false,emptyText:'',dropBackgroundColor:'green',noDropBackgroundColor:'red',dragText:'{0} selected row{1}',ddGroup:"GridDD",enableDrop:true,enableDrag:true,containerScroll:false,init:function(view){var me=this;view.on('render',me.onViewRender,me,{single:true});},destroy:function(){var me=this;Ext.destroy(me.dragZone,me.dropZone);},enable:function(){var me=this;if(me.dragZone){me.dragZone.unlock();}
if(me.dropZone){me.dropZone.unlock();}
me.callParent();},disable:function(){var me=this;if(me.dragZone){me.dragZone.lock();}
if(me.dropZone){me.dropZone.lock();}
me.callParent();},onViewRender:function(view){var me=this,scrollEl;if(me.enableDrag){if(me.containerScroll){scrollEl=view.getEl();}
me.dragZone=new Ext.view.DragZone({view:view,ddGroup:me.dragGroup||me.ddGroup,dragText:me.dragText,containerScroll:me.containerScroll,scrollEl:scrollEl,getDragData:function(e){var view=this.view,item=e.getTarget(view.getItemSelector()),record=view.getRecord(item),clickedEl=e.getTarget(view.getCellSelector()),dragEl;if(item){dragEl=document.createElement('div');dragEl.className='x-form-text';dragEl.appendChild(document.createTextNode(clickedEl.textContent||clickedEl.innerText));return{event:new Ext.EventObjectImpl(e),ddel:dragEl,item:e.target,columnName:view.getGridColumns()[clickedEl.cellIndex].dataIndex,record:record};}},onInitDrag:function(x,y){var self=this,data=self.dragData,view=self.view,selectionModel=view.getSelectionModel(),record=data.record,el=data.ddel;if(!selectionModel.isSelected(record)){selectionModel.select(record,true);}
self.ddel.update(el.textContent||el.innerText);self.proxy.update(self.ddel.dom);self.onStartDrag(x,y);return true;}});}
if(me.enableDrop){me.dropZone=new Ext.dd.DropZone(view.el,{view:view,ddGroup:me.dropGroup||me.ddGroup,containerScroll:true,getTargetFromEvent:function(e){var self=this,v=self.view,cell=e.getTarget(v.cellSelector),row,columnIndex;if(cell){row=v.findItemByChild(cell);columnIndex=cell.cellIndex;if(row&&Ext.isDefined(columnIndex)){return{node:cell,record:v.getRecord(row),columnName:self.view.up('grid').columns[columnIndex].dataIndex};}}},onNodeEnter:function(target,dd,e,dragData){var self=this,destType=target.record.fields.get(target.columnName).type.type.toUpperCase(),sourceType=dragData.record.fields.get(dragData.columnName).type.type.toUpperCase();delete self.dropOK;if(!target||target.node===dragData.item.parentNode){return;}
if(me.enforceType&&destType!==sourceType){self.dropOK=false;if(me.noDropCls){Ext.fly(target.node).addCls(me.noDropCls);}else{Ext.fly(target.node).applyStyles({backgroundColor:me.noDropBackgroundColor});}
return;}
self.dropOK=true;if(me.dropCls){Ext.fly(target.node).addCls(me.dropCls);}else{Ext.fly(target.node).applyStyles({backgroundColor:me.dropBackgroundColor});}},onNodeOver:function(target,dd,e,dragData){return this.dropOK?this.dropAllowed:this.dropNotAllowed;},onNodeOut:function(target,dd,e,dragData){var cls=this.dropOK?me.dropCls:me.noDropCls;if(cls){Ext.fly(target.node).removeCls(cls);}else{Ext.fly(target.node).applyStyles({backgroundColor:''});}},onNodeDrop:function(target,dd,e,dragData){if(this.dropOK){target.record.set(target.columnName,dragData.record.get(dragData.columnName));if(me.applyEmptyText){dragData.record.set(dragData.columnName,me.emptyText);}
return true;}},onCellDrop:Ext.emptyFn});}}});
