/*
 * @version   : 2.5.2 - Ext.NET Pro License
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2014-05-22
 * @copyright : Copyright (c) 2008-2014, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : See license.txt and http://www.ext.net/license/.
 */


Ext.define("Ext.net.GroupPaging",{alias:"plugin.grouppaging",constructor:function(config){if(config){Ext.apply(this,config);}},init:function(toolbar){this.toolbar=toolbar;this.store=toolbar.store;if(this.store.applyPaging){this.store.applyPaging=Ext.Function.bind(this.applyPaging,this);}
this.store.getTotalCount=this.getTotalCount;this.store.pageSize=1;if(this.store.proxy instanceof Ext.data.proxy.Memory){this.store.proxy.enablePaging=false;}},getGroups:function(records){var length=records.length,groups=[],pointers={},record,groupStr,group,children,first=this.store.groupers.first(),groupField=first.property,i;for(i=0;i<length;i++){record=records[i];groupStr=record.get(groupField);group=pointers[groupStr];if(group===undefined){group={name:groupStr,children:[]};groups.push(group);pointers[groupStr]=group;}
group.children.push(record);}
return groups;},applyPaging:function(){var allData=this.store.data,groups=this.getGroups(allData.items),data=new Ext.util.MixedCollection({getKey:Ext.data.Store.recordIdFn,maintainIndices:true});data.pageSize=this.store.pageSize;data.addAll(groups[this.store.currentPage-1].children);this.store.totalCount=groups.length;this.store.allData=allData;this.store.data=data;},getTotalCount:function(){return this.totalCount;}});
