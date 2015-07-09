
// @source data/PageProxy.js

Ext.define("Ext.data.proxy.Page", {
    extend: "Ext.data.proxy.Server",
    alias : 'proxy.page',
    isPageProxy : true,
    
    extractResponseData : function (response) {
        return response.data;
    },
    
    buildUrl : function () {
        return '';
    },
  
    doRequest : function (operation, callback, scope) {
        var request = this.buildRequest(operation, callback, scope),
            writer = this.getWriter(),
            requestConfig = Ext.apply({}, this.requestConfig || {});
        
        if (operation.allowWrite()) {
            writer.encode = true;
            writer.root = "serviceParams";
            writer.allowSingle = false;
            request = writer.write(request);
        }

        requestConfig.userSuccess = this.createSuccessCallback(request, operation, callback, scope);
        requestConfig.userFailure = this.createErrorCallback(request, operation, callback, scope);
        
        if (request.params.serviceParams) {
            requestConfig.serviceParams = request.params.serviceParams;
            delete request.params.serviceParams;
        }
        
        requestConfig.extraParams = request.params;

        var directFn = this.directFn || this.api[operation.action] || (operation.action != "read" ? this.api["sync"] : null);
        if (directFn) {                        
            if (Ext.isString(directFn)) {
                directFn = Ext.decode(directFn);
            }            

            var extraParams = requestConfig.extraParams,
                serviceParams = requestConfig.serviceParams;

            delete requestConfig.extraParams;
            delete requestConfig.serviceParams;

            requestConfig.successSeq = requestConfig.userSuccess;
            requestConfig.failureSeq = requestConfig.userFailure;

            delete requestConfig.userSuccess;
            delete requestConfig.userFailure;
            requestConfig.showFailureWarning = false;

            if (directFn.length === 1) {
                directFn(requestConfig);
            }
            else if (directFn.length === 2) {
                directFn(operation.action || null, requestConfig);
            }
            else if (directFn.length === 3) {
                directFn(operation.action || null, extraParams || null, requestConfig);
            }
            else {
                directFn(operation.action || null, extraParams || null, serviceParams || null, requestConfig);
            }                
        }
        else {        
            Ext.apply(requestConfig, { 
                control   : operation.store, 
                eventType : "postback", 
                action    : operation.action
            });        
        
            Ext.net.DirectEvent.request(requestConfig);        
        }
    },
    
    createSuccessCallback : function (request, operation, callback, scope) {
        var me = this;
        
        return function (response, result, context, type, action, extraParams) {
            var res;

            try {
                if (me.directFn || me.api[operation.action] || (operation.action != "read" ? me.api["sync"] : null)) {
                    res = Ext.isEmpty(result.result, true) ? (result.d || result) : result.result;

                    response.data = res;
                    res = {success:true};
                }
                else {
                    res = result.serviceResponse;
                    response.data = res.data ? res.data : {};
                    request._data = response.data;
                    if ((res || result).success === false) {
                        throw new Error((res || result).message);
                    }
                }
            } catch (e) {                
                operation.setException(e.message);
                me.setException = Ext.emptyFn;
                me.processResponse(false, operation, request, response, callback, scope);                
                me.setException = Ext.data.proxy.Page.prototype.setException;
                return;
            }
            
            me.processResponse(res.success, operation, request, response, callback, scope);
        };
    },
    
    createErrorCallback : function (request, operation, callback, scope) {
        var me = this;
        
        return function (response, result, context, type, action, extraParams) {
            operation.setException({
                status : response.status,
                statusText : response.statusText,
                responseText : response.responseText
            });   
            me.processResponse(false, operation, request, response, callback, scope);
        };
    },
    
    setReader : function (reader) {        
        var reader = this.callParent([reader]);
        reader.totalProperty = "total";
        if (!reader.root) {
            reader.root = "data";
        }
        reader.buildExtractors(true);
        
        return reader;
    }
});