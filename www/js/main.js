/*!
 * Ext Core Library $version&#xD;&#xA;http://extjs.com/&#xD;&#xA;Copyright(c) 2006-2009, $author.&#xD;&#xA;&#xD;&#xA;The MIT License&#xD;&#xA;&#xD;&#xA;Permission is hereby granted, free of charge, to any person obtaining a copy&#xD;&#xA;of this software and associated documentation files (the &quot;Software&quot;), to deal&#xD;&#xA;in the Software without restriction, including without limitation the rights&#xD;&#xA;to use, copy, modify, merge, publish, distribute, sublicense, and/or sell&#xD;&#xA;copies of the Software, and to permit persons to whom the Software is&#xD;&#xA;furnished to do so, subject to the following conditions:&#xD;&#xA;&#xD;&#xA;The above copyright notice and this permission notice shall be included in&#xD;&#xA;all copies or substantial portions of the Software.&#xD;&#xA;&#xD;&#xA;THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR&#xD;&#xA;IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,&#xD;&#xA;FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE&#xD;&#xA;AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER&#xD;&#xA;LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,&#xD;&#xA;OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN&#xD;&#xA;THE SOFTWARE.&#xD;&#xA;
 */

Ext.onReady(function() {
    Ext.get('search-text').on('focus', function () {
		swap(this, 'Search', '').toggleClass('focus');
    }).on('blur', function () {
		swap(this, '', 'Search').toggleClass('focus');
    });
	
	Ext.get('signup-name').on('focus', function () {
        swap(this, 'Name', '');
    }).on('blur', function () {
		swap(this, '', 'Name');
    });
	
	Ext.get('signup-email').on('focus', function () {
        swap(this, 'Email', '');
    }).on('blur', function () {
        swap(this, '', 'Email');
    });
	
	var swap = function (el, defaultValue, newValue) {	
		if (el.dom.value.replace(/^\s+|\s+$/g, "") == defaultValue) {
			el.dom.value = newValue;
		}
		
		return el;
	};
	
	new Ext.ux.SimpleCarousel('simpleslideshow-slides', {
		itemSelector   : 'div',
		transitionType : 'fade',
		interval       : 8
	});
}); 

Ext.ns('Ext.ux');

Ext.ux.SimpleCarousel = Ext.extend(Ext.util.Observable, {
    interval           : 5,
    transitionDuration : 1,
    transitionType     : 'carousel',
    transitionEasing   : 'easeIn',
    itemSelector       : 'img',
    activeSlide        : 0,
    autoPlay           : true,
    wrap               : false,
    freezeOnHover      : true,
    width              : null,
    height             : null,
	buttons            : [],
	buttonSelector     : '#simpleslideshow-buttons a',
	buttonActiveClass  : "active",

    constructor : function (id, config) {
        config = config || {};
        Ext.apply(this, config);

        Ext.ux.SimpleCarousel.superclass.constructor.call(this, config);

        this.addEvents(
            'change',
            'play',
            'pause',
            'freeze',
            'unfreeze'
        );

        this.el = Ext.get(id);
		
		if (this.el === null) {
			return;
		}
		
        this.slides = this.els = [];
        
        if (this.autoPlay) {
            this.wrap = true;
        };
					
		// Find nav button elements
		Ext.each(Ext.query(this.buttonSelector), function(el) {
			this.buttons.push(Ext.get(el));
		}, this);

        this.initMarkup();
        this.initEvents();
    },

    initMarkup : function () {
        var dh = Ext.DomHelper;
        
        this.carouselSize = 0;
        var items = this.el.select(this.itemSelector);
		
        this.els.container = dh.append(this.el, { cls : 'ux-carousel-container' }, true);
        this.els.slidesWrap = dh.append(this.els.container, { cls : 'ux-carousel-slides-wrap' }, true);

        // set the dimensions of the container
        this.slideWidth = this.width || this.el.getWidth(true);
        this.slideHeight = this.height || this.el.getHeight(true);
		
        this.els.container.setStyle({
            width  : this.slideWidth + 'px',
            height : this.slideHeight + 'px'
        });
        
        items.appendTo(this.els.slidesWrap).each(function (item) {
            item = item.wrap({cls: 'ux-carousel-slide'});
            this.slides.push(item);
            item.setWidth(this.slideWidth + 'px').setHeight(this.slideHeight + 'px');
        }, this);
		
        this.carouselSize = this.slides.length;
		
		this.el.clip();
    },

    initEvents : function () {
		for (var i = 0; i < this.buttons.length; i++) {
			this.buttons[i].on('click', function (ev, el, options) {
				this.pause();
				this.setSlide(options.index);
				this.play();
			}, this, {
				preventDefault : true,
				index          : i
			});
		}

        if (this.freezeOnHover) {
            this.els.container.on('mouseenter', function () {
                if (this.playing) {
                    this.fireEvent('freeze', this.slides[this.activeSlide]);
                    Ext.TaskMgr.stop(this.playTask);
                }
            }, this);
            this.els.container.on('mouseleave', function () {
                if (this.playing) {
                    this.fireEvent('unfreeze', this.slides[this.activeSlide]);
                    Ext.TaskMgr.start(this.playTask);
                }
            }, this, { buffer : (this.interval / 2) * 1000 });
        };

        if (this.interval && this.autoPlay) {
            this.play();
        };
    },

    play : function () {
        if (!this.playing) {
            this.playTask = this.playTask || {
                run : function () {
                    this.playing = true;
                    this.setSlide(this.activeSlide+1);
                },
                interval : this.interval * 1000,
                scope    : this
            };
            
            this.playTaskBuffer = this.playTaskBuffer || new Ext.util.DelayedTask(function () {
                Ext.TaskMgr.start(this.playTask);
            }, this);

            this.playTaskBuffer.delay(this.interval*1000);
            this.playing = true;
            
			this.fireEvent('play');
        }
		
        return this;
    },

    pause : function () {
        if (this.playing) {
            Ext.TaskMgr.stop(this.playTask);
            this.playTaskBuffer.cancel();
            this.playing = false;
			
			this.fireEvent('pause');
        }
		
        return this;
    },
    
    setSlide : function (index, initial) {
        if (!this.wrap && !this.slides[index]) {
            return;
        } else if (this.wrap) {
            if (index < 0) {
                index = this.carouselSize - 1;
            } else if (index > this.carouselSize - 1) {
                index = 0;
            }
        }
        if (!this.slides[index]) {
            return;
        }
		
        var offset = index * this.slideWidth;
		
        if (!initial) {
            switch (this.transitionType) {
                case 'fade':
                    this.slides[index].setOpacity(0);
                    this.slides[this.activeSlide].stopFx(false).fadeOut({
                        duration : this.transitionDuration / 2,
                        callback : function () {
                            this.els.slidesWrap.setStyle('left', (-1 * offset) + 'px');
                            this.slides[this.activeSlide].setOpacity(1);
                            this.slides[index].fadeIn({
                                duration: this.transitionDuration / 2
                            });
                        },
                        scope: this
                    })
                    break;
                default:
                    var xNew = (-1 * offset) + this.els.container.getX();
                    this.els.slidesWrap.stopFx(false);
                    this.els.slidesWrap.shift({
                        duration : this.transitionDuration,
                        x        : xNew,
                        easing   : this.transitionEasing
                    });
                    break;
            }
        } else {
            this.els.slidesWrap.setStyle('left', '0');
        }

        this.activeSlide = index;
        this.updateNav();
        this.fireEvent('change', this.slides[index], index);
    },

    updateNav : function () {
		for (var i = 0; i < this.buttons.length; i++) {
			if (i === this.activeSlide) {
				this.buttons[i].addClass(this.buttonActiveClass);
			} else {
				this.buttons[i].removeClass(this.buttonActiveClass);
			}
		}
    }
});