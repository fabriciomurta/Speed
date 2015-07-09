Ext.data.writer.Writer.override({
    expandData : true,

    write : function (request) {
        var operation = request.operation,            
            record,
            records   = operation.records || [],
            len       = records.length,
            i         = 0,
            data      = [];        

        for (; i < len; i++) {
            record = records[i];

            if (this.filterRecord && this.filterRecord(record) === false) {
                continue;
            }

            data.push(this.getRecordData(record, operation));
        }
        return this.writeRecords(request, data);
    },

    isSimpleField : function (f) {
        var type = f && f.type ? f.type.type : "";

        return type === "int" || type === "float" || type === "boolean" || type === "date";
    },

    writeValue : function (data, field, record) {
        var name = field[this.nameProperty],
            dateFormat = this.dateFormat || field.dateWriteFormat || field.dateFormat,
            value = record.get(field.name);

        // Allow the nameProperty to yield a numeric value which may be zero.
        // For example, using a field's numeric mapping to write an array for output.
        if (name == null) {
            name = field.name;
        }

        if (field.serialize) {
            data[name] = field.serialize(value, record);
        } else if (field.type === Ext.data.Types.DATE && dateFormat && Ext.isDate(value)) {
            data[name] = Ext.Date.format(value, dateFormat);
        } else {
            if (Ext.isEmpty(value, false) && this.isSimpleField(field)) {
                switch (field.submitEmptyValue) {
                    case "null":
                        data[name] = null;        
                        break;
                    case "emptystring":
                        data[name] = "";        
                        break;
                }
            } else {
                data[name] = this.htmlEncode || field.htmlEncode ? Ext.util.Format.htmlEncode(value) : value;
            }
        }
    },

    getRecordData : function (record, operation) {
        var isPhantom = record.phantom === true,
            writeAll = this.writeAllFields || isPhantom,            
            fields = record.fields,
            fieldItems = fields.items,
            clientIdProperty = record.clientIdProperty,
            data = {},
            changes,            
            field,
            key,
            value,
            mappedIdProperty,
            f, fLen;
        
        if (writeAll) {
            fLen = fieldItems.length;

            for (f = 0; f < fLen; f++) {
                field = fieldItems[f];

                if (this.filterField && this.filterField(record, field, field.name, record.get(field.name)) === false) {
                    continue;
                }

                if (field.persist) {
                   this.writeValue(data, field, record);
                }
            }
        } else {
            // Only write the changes
            changes = record.getChanges();
            for (key in changes) {                
                if (changes.hasOwnProperty(key)) {
                    field = fields.get(key);

                    if (this.filterField && this.filterField(record, field, key, changes[key]) === false) {
                        continue;
                    }
                    
                    if (field.persist) {
                        this.writeValue(data, field, record);
                    }               
                }
            }           
        }
        
        if (isPhantom) {
            if (clientIdProperty && operation && operation.records.length > 1) {
                // include clientId for phantom records, if multiple records are being written to the server in one operation.
                // The server can then return the clientId with each record so the operation can match the server records with the client records
                data[clientIdProperty] = record.internalId;
            }
         } else if (this.writeRecordId) {
            // Make sure that if a mapping is in place the mapped id name is used instead of the default field name. 
            mappedIdProperty = fields.get(record.idProperty)[this.nameProperty] || record.idProperty;
            data[mappedIdProperty] = record.getId();
        }

        if ((this.excludeId && data.hasOwnProperty(record.idProperty)) || 
           (this.skipIdForPhantomRecords !== false && data.hasOwnProperty(record.idProperty) && isPhantom)) {
            delete data[record.idProperty];
        }

        if (this.skipPhantomId && data.hasOwnProperty(record.clientIdProperty) && isPhantom) {
            delete data[record.clientIdProperty];
        }

        return data;
    }
});