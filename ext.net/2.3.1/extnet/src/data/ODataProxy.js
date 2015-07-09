/**
 * Class for construction the OData proxy for ExtJS 4.1.
 * @extends Ext.data.proxy.Ajax
 * @author Maicon Schelter
 * @example
 * Ext.create('Ext.data.Store',{
 * 		 autoLoad	: true
 * 		,autoSync	: true
 * 		,proxy : {
 * 			 type	: 'odata'
 * 			,url	: 'DTE/services/ListCars'
 * 			,params : {
 * 				type : 'DTE.Model.Cars'
 * 			}
 * 		}
 * 	});
 */
Ext.define("Ext.data.proxy.OData", {

    extend: "Ext.data.proxy.Ajax",
	alternateClassName: "Ext.data.OData",
	alias: "proxy.odata",
    isODataProxy : true,
    enablePagingParams : true,
    appendAction : false,

    /**
    * @cfg {Boolean} appendId
    * Indicate if concat ID at URL request.
    */
	appendId: true,

    /**
    * @cfg {Boolean} batchActions
    * Indicate if execute the batch action of request.
    */
	batchActions: false,

    /**
    * Method using with create the url of Ajax.
    * @method buildUrl
    * @param {Object} request Request options.
    * @private
    */
	buildUrl: function (request) {
	    var me = this,
			operation = request.operation,
			records = operation.records || [],
			record = records[0],
			format = me.format,
			url = me.getUrl(request),
            params     = request.params || {},            
			id = record && !record.phantom ? record.getId() : operation.id;

	    if (me.appendId && id) {
	        if (url.match(/\/$/)) {
                url = url.substring(0, url.length - 1);
            }
            url = url + "(" + id + ")";
	    }

        if (request.action == "read") {
            request.params = Ext.apply(request.params, {"$inlinecount": "allpages"});
        }

	    if (format) {
	        if (!url.match(/\.$/)) {
	            url += ".";
	        }

	        url += format;
	    }

	    request.url = url;

        delete params[me.idParam];

	    return me.callParent(arguments);
	},

    doRequest: function(operation, callback, scope) {
        this.sortParam = (scope.remoteSort ? "$orderby" : null);
	    this.filterParam = (scope.remoteFilter ? "$filter" : null);        
        this.startParam = (this.enablePagingParams ? "$skip" : null);
        this.limitParam = (this.enablePagingParams ? "$top" : null);

        this.getWriter().allowSingle = true;                
        this.json = true;

	    return this.callParent(arguments);
    },

    /**
    * Method using with create of sorters.
    * @method encodeSorters
    * @param {Array} sorters Request sorters.
    * @private
    */
    encodeSorters: function (sorters) {
	    var min = [],
			length = sorters.length,
			i = 0;

	    for (; i < length; i++) {
	        min[i] = sorters[i].property;

	        if (sorters[i].direction.toLowerCase() == "desc") {
	            min[i] += " desc";
	        }
	    }

	    return min.join(",");
	},

    /**
    * Method using with create of filters.
    * @method encodeFilters
    * @param {Array} filters Request filters.
    * @private
    */
	encodeFilters: function (filters) {
	    var filter = "",
            logical = "",
			length = filters.length,
			sq = "'",
			type = "",
            op = "",
            prop = "",
            val = "",
            item,
			i;

	    for (i = 0; i < length; i++) {
            item = filters[i];
	        type = item.type || "";
            logical = item.logical || "and";

            if (i > 0){
                filter += " " + logical + " ";
            }

	        switch (type) {
	            case "int":
	            case "bool":
	                type = "";
	                sq = "";
	                break;
	            case "guid":
	                type = "guid";
	                sq = "'";
	                break;
	            default:
	                type = "";
	                sq = "'";
	                break;
	        }
	        op = item.operator || "eq";
	        prop = item.property;
	        val = item.value;

	        if (op == "like") {
	            prop = "substringof('" + val + "', " + prop + ")";
	            val = "true";
	            op = "eq";
	            sq = "";
	        }

	        filter += prop + " " + op + " " + type + sq + val + sq;
	    }

	    return filter;
	},

    processResponse: function(success, operation, request, response, callback, scope) {
        var me = this,
            action = operation.action;
        
        if (action === 'read' || action === 'create') {
            this.callParent(arguments);
        }                
        else {            
            if (response.status !== 204 && response.status !== 202 && response.status !== 1223) {
                operation.setException(response.statusText);
                me.fireEvent('exception', this, response, operation);
            }
            else{
                operation.commitRecords(operation.records || []);
                operation.setCompleted();
                operation.setSuccessful();
            }

            me.afterRequest(request, success);
            
            if (typeof callback == 'function') {
                callback.call(scope || me, operation);
            }
        }
    }
}, function () {
    /**
    * Override defaults property's of requests.
    */
    Ext.apply(this.prototype, {
        actionMethods: {
            create: "POST",
			read: "GET",
			update: "PUT",
			destroy: "DELETE"
        },
        reader: {
            type: 'odata'
        },
		headers: {
		    "Accept": "application/json"
		},
		pageParam: undefined,
		noCache: false
    });
});

Ext.define("Ext.data.reader.OData",{
    extend: "Ext.data.reader.Json",    
    alias: "reader.odata",    
    root: "value",
    totalProperty: "odata_count",

    read: function (response) {
        if (response && response.responseText == "") {
            return this.nullResultSet;
        }
        
        var data;

        if (response) {
            data = response.responseText ? this.getResponseData(response) : this.readRecords(response);
        }

        return data || this.nullResultSet;
    },

    getData: function (response) {
        if(!Ext.isDefined(response[this.root]) && !Ext.isDefined(response["odata.count"])){
            var obj = {};
            obj[this.root] = Ext.isArray(response) ? response : [response];
            response = obj;
        }

        if(response && Ext.isDefined(response["odata.count"]))
        {
            response["odata_count"] = response["odata.count"];
        }

        return response;
    }
});