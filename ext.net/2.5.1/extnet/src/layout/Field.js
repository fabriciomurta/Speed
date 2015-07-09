
// @source core/layout/Field.js

Ext.layout.container.Form.override({
    transformItemRenderTree: function (item) {        
        if (item.tag && item.tag == 'table' && !item.width) {
            item.width = "100%";            
        }

        var cnItem = {
            tag: 'tr',
            cn: {
                tag: 'td',
                colspan: 3,
                style: 'width:100%',
                cn: item
            }
        };
        
        return {
            tag: 'tbody',
            cn: Ext.isIE6 ? 
                [
                    cnItem,
                    this.padRow
                ] : cnItem            
        };
    },

    // Fix for the GitHub issue #347
    getRenderTree: function() {
        var me = this,
            //result = me.callParent(arguments),
            result = Ext.layout.container.Form.superclass.getRenderTree.apply(this, arguments),
            i, len;
                
        if (result) { // added
            for (i = 0, len = result.length; i < len; i++) {
                result[i] = me.transformItemRenderTree(result[i]);
            }
        }

        return result;
    }
    // End of the fix for #347
});

Ext.layout.component.field.Field.override({
    finishedLayout : function(ownerContext) {
        this.callParent(arguments);

        if (this.owner.updateButtonsWidth) {
            this.owner.updateButtonsWidth();
        }
    },

    beginLayoutCycle : function (ownerContext) {        
        if (this.owner.labelAlign == "top") {
            this.owner.labelEl.parent("td").setStyle("width", "100%");
        
            if (this.owner.hasVisibleLabel()) {
                this.owner.labelEl.parent("tr").dom.style.display = "";
            }
            else {
                this.owner.labelEl.parent("tr").setStyle("display", "none");
            }
        }   
    
        if (!this.owner.indicatorEl) {        
            return this.callParent(arguments);
        }    

        var errorSide = this.owner.msgTarget == "side" && this.owner.hasActiveError(),
            showErrorStub = !this.owner.autoFitErrors || errorSide,
            w;

        if (!this.owner.isIndicatorActive && !this.owner.preserveIndicatorIcon) {
            this.owner.getErrorStub().setDisplayed(showErrorStub);
            this.owner.getIndicatorStub().setDisplayed(!errorSide);
            this.owner.getIndicatorStub().setStyle("width", "0px");
            this.owner.indicatorEl.parent("td").setDisplayed(!errorSide);
            this.owner.errorSideHide = errorSide;
            return this.callParent(arguments);
        }
    
        if (errorSide) {
            this.owner.hideIndicator(true);
            this.owner.errorSideHide = true;
            w = 0;
        } else {    
            if (this.owner.errorSideHide) {
                this.owner.showIndicator(true);
            }

            w = Ext.isIE7 ? this.owner.indicatorEl.getPadding("lr") : 0;

            this.owner.indicatorEl.setStyle("padding-left", this.owner.indicatorIconCls ? "18px" : "0px");
        
            if (this.owner.autoFitIndicator) {
               w = (this.owner.isIndicatorEmpty() || this.owner.indicatorHidden) ? (this.owner.preserveIndicatorIcon ? 18 : 0) : (this.owner.indicatorEl.getWidth() - w);           
               this.owner.indicatorEl.parent("td").setStyle("width", w + "px");
               this.owner.indicatorEl.parent().setStyle("width", w + "px");
               this.owner.indicatorEl.parent().setStyle("height", this.owner.inputEl ? (this.owner.inputEl.getHeight() +"px") : "22px");
               this.owner.indicatorEl.setStyle("width", w+"px");
            }
            else {
                w = this.owner.indicatorEl.getWidth() - w;            
            }
        }    

        this.owner.getErrorStub().setDisplayed(showErrorStub);
        this.owner.getIndicatorStub().setDisplayed(!this.owner.indicatorHidden);
        this.owner.getIndicatorStub().setStyle("width", w + "px");

        return this.callParent(arguments);
    }
});