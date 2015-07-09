Ext.define('Ext.net.PasswordMask', {
    extend: 'Ext.AbstractPlugin', 
    alias: 'plugin.passwordmask',
                        
	duration: 2000,
	replacementChar: '%u25CF',		    
            
    constructor: function(config) {
        this.callParent(arguments); 
               
        var field = this.getCmp(),
            name = field.getName() || field.id || field.getInputId();

        field.submitValue = false;

        this.hiddenField = Ext.create('Ext.form.field.Hidden', {
            name : name
        });
               
        if (field.rendered) {
            field.inputEl.dom.removeAttribute('name');
            this.renderHiddenField();
        }
        else {
            field.on("afterrender", this.renderHiddenField, this);
        }
               
        this.maskAll = Ext.Function.createBuffered(this._maskAll, this.duration, this);

        field.on("change", this.handleValue, this);               
        this.handleValue(field, field.getValue(), "");               
    },

    destroy : function () {
        this.callParent(arguments);
        this.hiddenField.destroy();
    },

    renderHiddenField : function () {
        var field = this.getCmp();
        if(field.ownerCt){
            field.ownerCt.items.add(this.hiddenField);
        }
        else{
            this.hiddenField.render(field.el.parent());
        }               
    },

    onDelete: function(caret, delta){
		var value = this.hiddenField.getValue(),
		    split = caret;

		if (Ext.isNumber(caret) && (this.getCaretPosition() < caret)) {			        
			split = caret - delta;
		}
		else if (!Ext.isObject(caret)) {			        
			caret = caret + delta;
		}

		this.hiddenField.setValue(value.slice(0, caret.start || split) + value.slice(caret.end || caret));
	},

    maskChars: function(str) {		        
		var tmp = '',
            value = this.hiddenField.getValue(),
		    add = 0,
            i;

		for (i=0; i < str.length; i++) {
			if (str.charAt(i) == unescape(this.replacementChar)) {
				tmp += value.charAt(i - add);
			} else {
				tmp += str.charAt(i);
				if (this.getCaretPosition() !== str.length) {
					add++;
				}
			}

		}
		this.hiddenField.setValue(tmp);
	},

    _maskAll: function() {
		var field = this.getCmp(),
            value = field.getValue(),
            tmp,
            caret,
            i;

        if (value != '') {
			tmp = '';
			for (i=0; i < value.length; i++) {
				tmp += unescape(this.replacementChar);
			}
			        
            if (field.hasFocus) {                        
                caret = this.getCaretRange();
            }

            field.setValue(tmp);
			        
            if (field.hasFocus) {                        
                this.restoreCaretPos(caret);
            }
		}
	},

    handleValue : function (field, newValue, oldValue) {
        var tmp,
            i,
            caret;

        if(!this.getCmp().hasFocus)
        {
            return;
        }

        newValue = newValue || "";
        oldValue = oldValue || "";
                
        if (newValue.length < oldValue.length) {			        
			this.onDelete(this.getCaretRange(), oldValue.length - newValue.length);
		}

        if (oldValue != newValue) {
			this.maskChars(newValue);
			if (newValue.length > 1) {
				tmp = '';
				for (i=0; i < newValue.length-1; i++) {
					tmp += unescape(this.replacementChar);
				}
				tmp += newValue.charAt(newValue.length-1);
				caret = this.getCaretRange();
				field.setValue(tmp);
				this.restoreCaretPos(caret);
			}			        

            this.maskAll();
		}
    },

    selectText : function(start, end){
        var me = this.getCmp(),
            v = me.getRawValue(),
            el = me.inputEl.dom,
            undef,
            range;

        if (v.length > 0) {
            start = start === undef ? 0 : start;
            end = end === undef ? v.length : end;
            if (el.setSelectionRange) {
                el.setSelectionRange(start, end);
            }
            else if(el.createTextRange) {
                range = el.createTextRange();
                range.moveStart('character', start);
                range.moveEnd('character', end - v.length);
                range.select();
            }
        }
    },

    restoreCaretPos: function(caret){
		if (!this.getCmp().hasFocus) {
            return;
        }

        if(Ext.isNumber(caret)) {
            return this.selectText(caret, caret);
        }
        else if(Ext.isObject(caret)) {
            return this.selectText(caret.start, caret.end);
        }
	},            

    getCaretPosition : function () {
        var caretPos = 0,
            field = this.getCmp(),
            dom = field.inputEl.dom,
            sel;
                
        if (document.selection) {
            //field.focus();
            sel = document.selection.createRange();
            sel.moveStart ('character', -field.getValue().length);
            caretPos = sel.text.length;
        }                
        else if (dom.selectionStart || dom.selectionStart == '0') {
            caretPos = dom.selectionStart;
        }

        return caretPos;
    },

    getSelectedRange : function () {
        var caretPos = 0,
            field = this.getCmp(),
            dom = field.inputEl.dom,
            sel;
                
        if (document.selection) {
            var start = 0, 
                end = 0, 
                normalizedValue, 
                textInputRange, 
                len, 
                endRange,
                range = document.selection.createRange();

            if (range && range.parentElement() == dom) {
                len = dom.value.length;

                normalizedValue = dom.value.replace(/\r\n/g, "\n");
                textInputRange = dom.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());
                endRange = dom.createTextRange();
                endRange.collapse(false);
                if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                    start = end = len;
                } else {
                    start = -textInputRange.moveStart("character", -len);
                    start += normalizedValue.slice(0, start).split("\n").length - 1;
                    if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                        end = len;
                    } else {
                        end = -textInputRange.moveEnd("character", -len);
                        end += normalizedValue.slice(0, end).split("\n").length - 1;
                    }
                }
            }

            caretPos = {                    
                start : start,
                end : end
            };
        }                
        else if (dom.selectionStart || dom.selectionStart == '0') {
            caretPos = {                    
                start : dom.selectionStart,
                end : dom.selectionEnd
            };
        }

        return caretPos;
    },

	getCaretRange: function(){		        
		var range = this.getSelectedRange();
        return (range.start === range.end) ? this.getCaretPosition() : range;
	}
});