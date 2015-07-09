Ext.data.writer.Writer.override({
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
        var name = field[this.nameProperty] || field.name,
            dateFormat = this.dateFormat || field.dateWriteFormat || field.dateFormat,
            value = record.get(field.name);

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
            f, fLen;
        
        if (writeAll) {
            fLen = fieldItems.length;

            for (f = 0; f < fLen; f++) {
                field = fieldItems[f];

                if (this.filterField && this.filterField(record, field, record.get(field.name)) === false) {
                    return;
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
                    if (this.filterField && this.filterField(record, key, changes[key]) === false) {
                        continue;
                    }

                    field = fields.get(key);
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
        } else {
            // always include the id for non phantoms
            data[record.idProperty] = record.getId();
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