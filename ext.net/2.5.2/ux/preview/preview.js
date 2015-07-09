/*
 * @version   : 2.5.2 - Ext.NET Pro License
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2014-05-22
 * @copyright : Copyright (c) 2008-2014, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : See license.txt and http://www.ext.net/license/.
 */


Ext.define('Ext.ux.PreviewPlugin',{extend:'Ext.AbstractPlugin',alias:'plugin.preview',requires:['Ext.grid.feature.RowBody','Ext.grid.feature.RowWrap'],hideBodyCls:'x-grid-row-body-hidden',bodyField:'',previewExpanded:true,constructor:function(config){this.callParent(arguments);},setCmp:function(grid){this.callParent(arguments);var bodyField=this.bodyField,hideBodyCls=this.hideBodyCls,features=[{ftype:'rowbody',getAdditionalData:function(data,idx,record,orig,view){var getAdditionalData=Ext.grid.feature.RowBody.prototype.getAdditionalData,additionalData={rowBody:data[bodyField],rowBodyCls:grid.previewExpanded?'':hideBodyCls};if(getAdditionalData){Ext.apply(additionalData,getAdditionalData.apply(this,arguments));}
return additionalData;}},{ftype:'rowwrap'}];grid.previewExpanded=this.previewExpanded;if(!grid.features){grid.features=[];}
grid.features=features.concat(grid.features);},toggleExpanded:function(expanded){var view=this.getCmp();this.previewExpanded=view.previewExpanded=expanded;view.refresh();}});
