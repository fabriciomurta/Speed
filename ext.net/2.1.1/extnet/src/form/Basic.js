
// @source core/form/BasicForm.js

Ext.form.BasicForm.override({
    prefixRegex : /[^.]+$/,

    removePrefix : function (name) {
        if (Ext.isEmpty(name) || !Ext.net.ResourceMgr.isMVC) {
            return name;
        }

        var match = name.match(this.prefixRegex);
        return match ? match[0] : name;
    },
    
    findField: function (id) {
        var withoutPrefixId = this.removePrefix(id);
        return this.getFields().findBy(function (f) {
            return f.id === id || f.getName() === id || this.removePrefix(f.getName()) === withoutPrefixId;
        }, this);
    },

    getFieldValues: function (dirtyOnly, removePrefix) {
        return this.getValues(false, dirtyOnly, false, true, removePrefix);
    },

    getValues: function (asString, dirtyOnly, includeEmptyText, useDataValues, removePrefix) {
        var values  = {},
            fields  = this.getFields().items,
            f,
            fLen    = fields.length,
            isArray = Ext.isArray,
            field, data, val, bucket, name, withoutPrefixName;

        for (f = 0; f < fLen; f++) {
            field = fields[f];

            if (!dirtyOnly || field.isDirty()) {
                data = field[useDataValues ? 'getModelData' : 'getSubmitData'](includeEmptyText);

                if (Ext.isObject(data)) {
                    for (name in data) {
                        if (data.hasOwnProperty(name)) {
                            val = data[name];

                            if (includeEmptyText && val === '') {
                                val = field.emptyText || '';
                            }

                            withoutPrefixName = removePrefix === true ? this.removePrefix(name) : name;

                            if (values.hasOwnProperty(withoutPrefixName)) {
                                bucket = values[withoutPrefixName];

                                if (!isArray(bucket)) {
                                    bucket = values[withoutPrefixName] = [bucket];
                                }

                                if (isArray(val)) {
                                    values[withoutPrefixName] = values[withoutPrefixName] = bucket.concat(val);
                                } else {
                                    bucket.push(val);
                                }
                            } else {
                                values[withoutPrefixName] = val;
                            }
                        }
                    }
                }
            }
        }

        if (asString) {
            values = Ext.Object.toQueryString(values);
        }
        return values;
    },

    updateRecord : function (record) {
        if (!record) {
            record = this._record;
        }

        var fields = record.fields.items,
            values = this.getFieldValues(false, true),
            obj = {},
            i = 0,
            len = fields.length,
            name;

        for (; i < len; ++i) {
            name  = fields[i].name;

            if (values.hasOwnProperty(name)) {
                obj[name] = values[name];
            }
        }

        record.beginEdit();
        record.set(obj);
        record.endEdit();

        return this;
    },

    afterAction: function (action, success) {
        this.callParent(arguments);

        if (action.result && action.result.script && action.result.script.length > 0) {
            if (window.execScript) {
                window.execScript(action.result.script);
            } else {
                window.eval.call(window, action.result.script);
            }
        }
    }
});