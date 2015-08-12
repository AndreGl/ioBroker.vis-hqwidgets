"use strict";


(function ( $ ) {
    $.fn.scala = function (options, arg) {
        if (typeof options == 'string') {
            if (options == 'value') {
                return this.each(function () {
                    var $this = $(this);
                    $this.find('.scalaInput').val(arg).trigger('change');
                });
            }
            return;
        }

        function h2rgba (h, a) {
            var rgb;
            h = h.substring(1,7);
            rgb = [
                parseInt(h.substring(0,2), 16),
                parseInt(h.substring(2,4), 16),
                parseInt(h.substring(4,6), 16)
            ];

            return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
        }

        var settings = $.extend({
            bgColor:    "#EEEEEE",
            value:      0,
            width:      0,
            thickness:  null,
            unit:       null,
            fontSize:   24,
            readOnly:   false,
            color:      '#FFCC00',
            alwaysShow: false,
            hideNumber: false,
            change:      function (value) {
                console.log('change ' + value);
            },
            changing:   function (value) {},
            onshow:     function (isShow) {},
            onhide:     function (isShow) {},
            click:      function () {
                //console.log('click');
            },
            colorize: function (color, value) {
                return h2rgba(color, (value - settings.min) / (settings.max - settings.min) + 0.5)
            },
            min: 0,
            max: 100
        }, options);

        return this.each(function () {
            // Do something to each element here.
            var $this = $(this);
            if ($this.data('scaled')) return;
            $this.data('scaled', true);
            $this.wrapInner('<div class="scalaWrapped"></div>');
            var divW = $this.width();
            var divH = $this.height();
            var divMax = ((divW > divH) ? divW : divH);

            // calculate thickness
            if (!settings.width)     settings.width = Math.round(divMax + 30) + '';
            if (!settings.thickness) settings.thickness = 1 - (divMax / settings.width);

            $this.prepend('<input type="text" value="' + settings.value + '" class="scalaInput" data-width="' + settings.width + '" data-thickness="' + settings.thickness + '"/>');

            var $scalaInput   = $this.find('.scalaInput');
            var $scalaWrapped = $this.find('.scalaWrapped');

            var $knobDiv = $scalaInput.knob({
                release: function () {
                    $knobDiv._mouseDown = false;

                    hide('release');

                    if ($knobDiv._pressTimer) {
                        $knobDiv._pressTimer = null;
                        setValue($knobDiv._oldValue);
                        if (settings.click) {
                            var newVal = settings.click($knobDiv._oldValue);

                            if (newVal !== undefined) setValue(newVal);
                        }
                    } else {
                        // remove unit
                        var val = $scalaInput.val();
                        if (settings.unit !== null && val.substring(val.length - settings.unit.length, val.length) == settings.unit) {
                            val = val.substring(0, val.length - settings.unit.length);
                        }
                        if (settings.change && $knobDiv._oldValue != val) settings.change(val);
                    }
                },
                cancel: function () {
                    $knobDiv._mouseDown = false;
                    hide('cancel');
                    // set old value
                    setValue($knobDiv._oldValue);

                },
                change: function (value) {
                    if (settings.changing) settings.changing(value);
                },
                format: function (v) {
                    if (settings.unit) v = v + settings.unit;
                    return v;
                },
                displayPrevious : true,
                displayInput:     !settings.hideNumber,
                bgColor:          settings.bgColor,
                readOnly:         settings.readOnly,
                fgColor:          settings.color,
                inputColor:       settings.color,
                colorize:         settings.colorize ? settings.colorize : undefined,
                min:              settings.min,
                max:              settings.max
            });

            var w = $knobDiv.width();
            $this.data('$knobDiv', $knobDiv);

            function setValue(value) {
                console.log('Restore value ' + value);
                setTimeout(function () {
                    $scalaInput.val(value).trigger('change');
                }, 200);
            }

            function hide(event){
                if (!settings.alwaysShow && !$knobDiv._mouseEnter && !$knobDiv._mouseDown) {
                    $knobDiv.hide();
                    $scalaWrapped.show();
                    if (settings.onhide) settings.onhide(false);
                }
                //console.log((event || '') +  ' (enter: ' + $knobDiv._mouseEnter + ', down: ' + $knobDiv._mouseDown + ')');
            }
            function show(event){
                $knobDiv.show();
                if (settings.onshow) settings.onshow(true);

                //console.log((event || '') +  ' (enter: ' + $knobDiv._mouseEnter + ', down: ' + $knobDiv._mouseDown + ')');
            }

            function press(event) {
                if (!$knobDiv._mouseDown) {
                    var val = $scalaInput.val();
                    if (settings.unit !== null) {
                        val = val.substring(0, val.length - settings.unit.length);
                    }

                    $knobDiv._oldValue = val;
                    $knobDiv._mouseDown = true;
                    $knobDiv._pressTimer = setTimeout(function () {
                        $knobDiv._pressTimer = null;
                    }, 300);
                    console.log((new Date().getSeconds() + '.' + new Date().getMilliseconds())+ ' ' + (event || '') +  ' (enter: ' + $knobDiv._mouseEnter + ', down: ' + $knobDiv._mouseDown + ')');
                    show(event);
                }
            }
            function unpress(event) {
                $knobDiv._mouseDown = false;
                console.log((new Date().getSeconds() + '.' + new Date().getMilliseconds()) + ' ' + (event || '') +  ' (enter: ' + $knobDiv._mouseEnter + ', down: ' + $knobDiv._mouseDown + ')');
                hide(event);

                if ($knobDiv._pressTimer) {
                    clearTimeout($knobDiv._pressTimer);
                }
            }

            $knobDiv.css({
                position: 'absolute',
                left:      '-' + ((w - divW) / 2) + 'px',
                top:       '-' + ((w - divH) / 2) + 'px',
                'z-index': 2,
                cursor:    'pointer',
                'opacity': 0.7
            }).bind('mouseleave',function (e) {
                $knobDiv._mouseEnter = false;
                hide(e.type);
            }).bind('mousedown', function (e) {
                press(e.type);
            }).bind('mouseup', function (e) {
                unpress(e.type);
            }).bind('mouseenter', function (e) {
                $knobDiv._mouseEnter = true;
                show(e.type);
            }).bind('touchend', function (e) {
                $knobDiv._mouseEnter = false;
                unpress(e.type);
            });
            if (!settings.alwaysShow) {
                $knobDiv.hide();
            }

            $this.bind('mouseenter', function (e) {
                $knobDiv._mouseEnter = true;
                show(e.type);
            }).bind('touchstart', function (e) {
                if (e.simulated) {
                    e.preventDefault();
                    return;
                }
                press(e.type);
                var event = $.Event(e.type, {simulated: true, originalEvent: {touches: [{pageX: e.originalEvent.touches[e.originalEvent.touches.length - 1].pageX, pageY: e.originalEvent.touches[e.originalEvent.touches.length - 1].pageY}]}} );
                $knobDiv.find('canvas').trigger(event);
                e.preventDefault();
            }).bind('mousedown', function (e) {
                if (e.simulated) {
                    e.preventDefault();
                    return;
                }
                press(e.type);
                var event = $.Event(e.type, {simulated: true, pageX: e.pageX, pageY: e.pageY});
                $knobDiv.find('canvas').trigger(event);
                e.preventDefault();
            });

            $scalaInput.bind('focusout', function (e) {
                $knobDiv._mouseEnter = false;
                hide(e.type)
            }).bind('focusin', function (e) {
                unpress(e.type);
            }).css({
                'font-size': settings.fontSize,
                cursor: 'pointer',
                '-webkit-touch-callout': 'none',
                '-webkit-user-select': 'none',
                '-khtml-user-select': 'none',
                '-moz-user-select': 'none',
                '-ms-user-select': 'none',
                'user-select': 'none'
            }).prop('readonly', true);
        });
    };

    $.fn.shineCheckbox = function (options, arg) {
        if (typeof options == 'string') {
            if (options == 'value') {
                return this.each(function () {
                    var $this = $(this);
                    var f = parseFloat(arg);
                    if (f.toString() == arg) {
                        $this.prop('checked', f > 0).trigger('change');
                    } else {
                        $this.prop('checked', arg === 'true' || arg === true).trigger('change');
                    }
                });
            }
            return;
        }

        if (!options) options = {};

        var settings = {
            backgroundCheckbox: '',//-webkit-linear-gradient(top, #fe9810 0%,#e75400 61%,#e75400 91%,#ea8810 100%)",
            backgroundButton: '',//"-webkit-linear-gradient(top, #efeeee 0%,#bcb9b8 100%);",
            checkboxSize:  options.checkboxSize || 'big',
            checkboxColor: options.checkboxColor || 'orange',
            readOnly: options.readOnly || false
        };

        return this.each(function () {
            // Do something to each element here.
            var $this = $(this);
            if ($this.data('shineCheckbox')) return;
            $this.data('shineCheckbox', true);
            $this.hide();
            var checkboxStyle = 'background: ' + settings.backgroundCheckbox;
            var buttonStyle   = 'background: ' + settings.backgroundButton;

            $this.wrap('<div class="checkbox-' + settings.checkboxSize + '-' + settings.checkboxColor + '-wrap" style="' + checkboxStyle + '"><div class="checkbox-' + settings.checkboxSize + '-' + settings.checkboxColor + '-button" style="' + buttonStyle + '"></div></div>');
            $this.change(function () {
                console.log('change ' + $this.prop('checked'));
                if ($this.prop('checked')) {
                    setTimeout(function () {
                        $this.parent().addClass('checkbox-' + settings.checkboxSize + '-' + settings.checkboxColor + '-button-active');
                    }, 100);
                } else {
                    $this.parent().removeClass('checkbox-' + settings.checkboxSize + '-' + settings.checkboxColor + '-button-active');
                }
            });

            if (!settings.readOnly) {
                $this.parent().parent().click(function () {
                    console.log($this.prop('checked'));
                    $this.prop('checked', !$this.prop('checked')).trigger('change');
                });
            }

            if ($this.prop('checked')) $this.parent().addClass('checkbox-' + settings.checkboxSize + '-' + settings.checkboxColor + '-button-active');
        });
    };

    // possible options: waves wobble tada swing shake rubberBand pulse flash bounce
    $.fn.animateDiv = function (effect, options) {
        return this.each(function () {
            // Do something to each element here.
            var $this = $(this);
            options = options || {};
            effect = effect || 'waves';

            if (options.speed != 1 && options.speed != 2 && options.speed != 2) options.speed = 1;

            if (effect == 'waves') {
                var borderThickness = (options.tickness || 3) - 1;
                var border = ';border: ' + borderThickness + 'px ' + (options.style || 'solid') +' ' + (options.color || 'grey');

                var text = '<div class="wave wave1" style="top:-' + borderThickness + 'px; left: -' + borderThickness + 'px;width: ' + Math.round($this.width()) +
                    'px;height: ' + Math.round($this.height()) + 'px;border-radius: ' + (options.radius || $this.css('border-radius')) +
                    border +
                    '; position: absolute"></div>';
                $this.append(text);
                $this.append(text.replace('wave1', 'wave2'));

                $this.find('.wave1').show().addClass('animated' + options.speed + 's zoomIn1');
                $this.find('.wave2').show().addClass('animated' + options.speed + 's zoomIn2');

                setTimeout(function () {
                    $this.find('.wave1').remove();
                    $this.find('.wave2').remove();
                }, 2050);
            } else {
                $this.addClass('animated' + options.speed + 's ' + effect);
                setTimeout(function () {
                    $this.removeClass('animated' + options.speed + 's ' + effect);
                }, 2100);
            }
        });
    };

    $.fn.popupShow = function ($div, options, callback) {

        if (typeof options == 'function') {
            callback = options;
            options = null;
        }
        options = options || {};
        options.effect   = options.effect || 'zoomIn';
        options.speed    = options.speed  || '05';
        options.relative = options.relative || false;
        return this.each(function () {
            // Do something to each element here.
            var $this = $(this);
            if (!$div) {
                console.log('no div');
                return;
            }
            var offset = $this.position();
            var eTop  = options.relative ? 0 : offset.top; //get the offset top of the element
            var eLeft = options.relative ? 0 : offset.left; //get the offset top of the element

            var dh = $div.show().height();
            var dw = $div.width();
            // calculate center
            var x = $this.width();
            var y = $this.height();
            var zindex = $div.css('z-index');
            zindex = options.zindex || ((zindex == 'auto') ? 1 : (zindex || 0) + 1);
            $div.css({position: 'absolute', left: eLeft + ($this.width() - dw) / 2, top: eTop + ($this.height() - dh) / 2, 'z-index': zindex});
            setTimeout(function () {
                $div.addClass('animated' + options.speed + 's ' + options.effect);
            }, 0);
            setTimeout(function () {
                $div.removeClass('animated' + options.speed + 's ' + options.effect);
                if (callback) callback();
            }, (options.speed == '05') ? 550 : parseInt(options.speed, 10) * 1000 + 50);
        });
    };
    $.fn.popupHide = function ($div, options, callback) {
        if (typeof $div == 'function') {
            callback = $div;
            $div = null;
        }
        if (typeof options == 'function') {
            callback = options;
            options = null;
        }
        options = options || {};
        options.effect = options.effect || 'zoomOut';
        options.speed  = options.speed  || '05';

        return this.each(function () {
            // Do something to each element here.
            if (!$div) {
                $div = $(this);
            }
            setTimeout(function () {
                $div.addClass('animated' + options.speed + 's ' + options.effect);
            }, 0);
            setTimeout(function () {
                $div.removeClass('animated' + options.speed + 's ' + options.effect);
                $div.hide();
                if (callback) callback();
            }, (options.speed == '05') ? 550 : parseInt(options.speed, 10) * 1000 + 50);
        });
    };

    $.fn.makeSlider = function (options, onChange, onIdle) {
        if (options == 'hide') {
            return this.each(function () {
                var $this = $(this);
                var timer = $this.data('hideTimer');
                if (timer) clearTimeout(timer);
                $this.data('hideTimer', null);
                $this.hide();
            });
        } else if (options == 'show') {
            return this.each(function () {
                var $this     = $(this).show();
                var hideTimer = $this.data('hideTimer');

                options = $this.data('options');

                if (onChange !== undefined) {
                    if (options.invert) onChange = options.max - onChange + options.min;
                    $this.slider("value", onChange);
                }

                if (hideTimer) clearTimeout(hideTimer);

                if (options.timeout) {
                    $this.data('hideTimer', setTimeout(function () {
                        $this.data('hideTimer', null);
                        if (options.onIdle) options.onIdle();
                    }, options.timeout));
                }
            });
        }
        if (typeof options == 'string') {
            if (options == 'restart') {
                return this.each(function () {
                    var $this = $(this);
                    var options = $this.data('options');
                    if (options.timeout) {
                        $this.data('hideTimer', setTimeout(function () {
                            if (options.onIdle) options.onIdle();
                        }, options.timeout));
                    }
                });
            }
            return;
        }

        if (typeof options == 'function') {
            onIdle   = onChange;
            onChange = options;
            options  = null;
        }

        options = options || {};

        options.timeout  = (options.timeout === undefined) ? 2000  : options.timeout;
        options.min      = (options.min === undefined)     ? 0     : options.min;
        options.max      = (options.max === undefined)     ? 100   : options.max;
        options.value    = (options.value === undefined)   ? options.max : options.value;
        options.show     = (options.show === undefined)    ? true  : options.show;
        options.onIdle   = onIdle;
        options.onChange = onChange;

        if (options.invert) {
            options.value = options.max - options.value + options.min;
        }

        return this.each(function () {
            var $this = $(this);

            if (options.timeout && options.show) {
                $this.data('hideTimer', setTimeout(function () {
                    $this.data('hideTimer', null);
                    if (onIdle) onIdle();
                }, options.timeout));
            }

            $this.data('options', options);

            $this.slider({
                orientation:    "vertical",
                range:          "max",
                min:            options.min,
                max:            options.max,
                value:          options.value,
                start:          function () {
                    var timer = $this.data('hideTimer');
                    if (timer) {
                        clearTimeout(timer);
                        $this.data('hideTimer', null);
                    }
                },
                stop:           function (event, ui) {
                    var hideTimer = $this.data('hideTimer');

                    if (hideTimer) clearTimeout(hideTimer);

                    if (options.onChange) {
                        var val = ui.value;
                        if (options.invert) {
                            val = options.max - ui.value + options.min;
                        }

                        options.onChange(val);
                    }

                    if (options.timeout) {
                        $this.data('hideTimer', setTimeout(function () {
                            $this.data('hideTimer', null);
                            if (options.onIdle) options.onIdle();
                        }, options.timeout));
                    }
                }
            });

            $this.find('.ui-slider-range').removeClass("ui-widget-header").addClass('hq-blind-blind').css({'background-position': '0% 100%'});
        });
    };

    $.fn.batteryIndicator = function (options, args) {
        if (typeof options == 'string') {
            if (options == 'show') {
                return this.each(function () {
                    var $this = $(this);
                    if (args === undefined) args = true;

                    if (args) {
                        $this.find('.vis-hq-battery').show();
                    } else {
                        $this.find('.vis-hq-battery').hide();
                    }
                });
            } else
            if (options == 'hide') {
                return this.each(function () {
                    $(this).find('.vis-hq-battery').hide();
                });
            }
            return;
        }

        options = options || {};
        options.color = options.color || '#FF5555';
        options.angle = (options.angle !== undefined) ? options.angle : -90;
        options.size  = options.size  || 32;
        options.title = options.title || '';

        return this.each(function () {
            var $this = $(this);

            $this.data('options', options);
            if ($this.find('.vis-hq-battery').length) return;

            $this.append('<div class="vis-hq-battery ' + (options.classes || '') + '" title="' + options.title + '">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="' + options.size + '" height="' + options.size + '" viewBox="0 0 48 48">' +
                '<path d="M0 0h48v48h-48z" fill="none"/>' +
                '<path fill="' + options.color + '" transform="rotate(' + options.angle + ', 24, 24)" d="M31.33 8h-3.33v-4h-8v4h-3.33c-1.48 0-2.67 1.19-2.67 2.67v30.67c0 1.47 1.19 2.67 2.67 2.67h14.67c1.47 0 2.67-1.19 2.67-2.67v-30.67c-.01-1.48-1.2-2.67-2.68-2.67zm-5.33 28h-4v-4h4v4zm0-8h-4v-10h4v10z"/></svg>' +
                '</div>');
            if (!options.show) {
                $this.find('.vis-hq-battery').hide();
            }
        });
    };

    $.fn.popupDialog = function (options) {
        return this.each(function () {
            var $this = $(this);
            var $dialog;
            //    timeout: data.dialog_timeout,

            var dialog = $this.data('dialog');
            if (!dialog) {
                if (typeof options == 'string') {
                    console.log('Show prior init');
                    return;
                }
                var text = '<div class="vis-hq-dialog" style="display: none"></div>';
                $this.append(text);
                $dialog = $this.find('.vis-hq-dialog');

                $this.data('dialog', $dialog[0]);

                var dialogButtons = [
                    {
                        text: _('Ok'),
                        click: function () {
                            $dialog.dialog('close');
                        },
                        id: 'ok'
                    }
                ];

                dialogButtons[_('Ok')] = function () {
                    $dialog.dialog('close');
                };
                if (options.timeout) {
                    dialogButtons.unshift( {
                        id: 'donthide',
                        text: '',
                        icons: {primary: 'ui-icon-pin-w'},
                        click: function () {
                            $dialog.data('no-timeout', !$dialog.data('no-timeout'));
                            if ($dialog.data('no-timeout')) {
                                $(this).parent().find('#donthide').addClass('ui-state-error').button({
                                    icons: {primary: 'ui-icon-pin-s'}
                                });
                                var timeout = $dialog.data('timeout');
                                if (timeout) {
                                    clearTimeout(timeout);
                                    $dialog.data('timeout', null);
                                }
                            } else {
                                $(this).parent().find('#donthide').removeClass('ui-state-error').button({
                                    icons: {primary: 'ui-icon-pin-w'}
                                });
                                $dialog.data('timeout', setTimeout(function () {
                                    $dialog.dialog('close');
                                }, data.timeout));
                            }
                        }
                    });
                }

                $dialog.dialog({
                    autoOpen: options.open || false,
                    width:    options.width  || 800,
                    height:   options.height || 400,
                    modal:    options.modal === undefined ? true : !!options.modal,
                    title:    options.title  || _('Chart'),
                    show:     { effect: options.effect, duration: 500 },
                    open:    function (event, ui) {
                        $(this).parent().find('#donthide').css({width: 37, height: 37});
                        $(this).parent().find("#ok").focus();
                        if (options.effect) {
                            setTimeout(function () {
                                $dialog.html(options.content || '');
                            }, 500);
                        } else {
                            $dialog.html(options.content || '');
                        }
                        if (options.timeout && !$dialog.data('no-timeout')) {
                            $dialog.data('timeout', setTimeout(function () {
                                $dialog.dialog('close');
                            }, options.timeout));
                        }
                        //$('[aria-describedby="dialog_delete"]').css('z-index', 11002);
                        //$('.ui-widget-overlay').css('z-index', 1001);
                    },
                    close:   function () {
                        $dialog.html('');
                        var timeout = $dialog.data('timeout');
                        if (timeout) {
                            clearTimeout(timeout);
                            $dialog.data('timeout', null);
                        }
                    },
                    buttons: dialogButtons
                });
                $dialog.data('data', options);
            } else {
                $dialog = $(dialog);
            }
            var data = $dialog.data('data');

            if (typeof options == 'string') {
                switch (options) {
                    case 'show':
                        $dialog.dialog('open');
                        break;

                    case 'hide':
                        $dialog.dialog('close');
                        break;

                    default:
                        console.log('Unknown command ' + options);
                        break;
                }
            }
        });
    };
}(jQuery));

// Add words for bars
if (vis.editMode) {
    $.extend(true, systemDictionary, {
        "circleWidth":      {"en": "Сircle width",      "de": "Kreisbreite",            "ru": "Ширина дуги"},
        "showValue":        {"en": "Show value",        "de": "Wert anzeigen",          "ru": "Показать значение"},
        "alwaysShow":       {"en": "Always show circle", "de": "Kreis immer zeigen",    "ru": "Показывать круг всегда"},
        "iconName":         {"en": "Icon",              "de": "Kleinbild",              "ru": "Миниатюра"},
        "iconOn":           {"en": "Active icon",       "de": "Aktivbild",              "ru": "Активная миниатюра"},
        "btIconWidth":      {"en": "Icon width",        "de": "Bildbreite",             "ru": "Ширина миниатюры"},
        "offsetAuto":       {"en": "Auto positioning",  "de": "Positionieren(Auto)",    "ru": "Автоматическое позиционирование"},
        "leftOffset":       {"en": "Left offset",       "de": "Offset links",           "ru": "Сдвиг слева"},
        "topOffset":        {"en": "Top offset",        "de": "Offset von Oben",        "ru": "Сдвиг сверху"},
        "group_leftRight":  {"en": "Descriptions",      "de": "Beschreibungen",         "ru": "Подписи"},
        "hoursLastAction":  {"en": "Hide last action after(hrs)", "de": "Ausblenden letze Anderungszeit nach(Std)", "ru": "Скрыть последнее изменение(часов)"},
        "timeAsInterval":   {"en": "Time as interval",  "de": "Zeit als Intervall",     "ru": "Время, как интервал"},
        "descriptionLeft":  {"en": "Description (left)", "de": "Beschreibung (links)",  "ru": "Подпись (слева)"},
        "infoLeftFontSize": {"en": "Left font size",    "de": "Schriftgrosse links",    "ru": "Размер шрифта слева"},
        "infoRight":        {"en": "Description (right)", "de": "Beschreibung (rechts)", "ru": "Подпись (справа)"},
        "infoFontRightSize": {"en": "Right font size",  "de": "Schriftgrosse rechts",   "ru": "Размер шрифта справа"},
        "group_styles":     {"en": "Styles",            "de": "Stil",                   "ru": "Стили"},
        "styleNormal":      {"en": "Normal",            "de": "Normal",                 "ru": "Нормальный"},
        "styleActive":      {"en": "Active",            "de": "Aktiv",                  "ru": "Активный"},
        "usejQueryStyle":   {"en": "Use jQuery Styles", "de": "jQuery Stil anwenden",   "ru": "Применить jQuery стили"},
        "changeEffect":     {"en": "Change effect",     "de": "Anderungseffekt",        "ru": "Эффект при изменении"},
        "waveColor":        {"en": "Wave color",        "de": "Wellenfarbe",            "ru": "Цвет волн"},
        "testActive":       {"en": "Test",              "de": "Test",                   "ru": "Тест"},
        "group_value":      {"en": "Value",             "de": "Wert",                   "ru": "Значение"},
        "unit":             {"en": "Unit",              "de": "Einheit",                "ru": "Единицы"},
        "readOnly":         {"en": "Read only",         "de": "Nur lesend",             "ru": "Не изменять"},
        "group_center":     {"en": "Center",            "de": "Zentrum",                "ru": "Центр"},
        "caption":          {"en": "Caption",           "de": "Beschriftung",           "ru": "Подпись"},
        "hideNumber":       {"en": "Hide number",       "de": "Nummer ausblenden",      "ru": "Скрыть число"},
        "group_arc":        {"en": "Arc",               "de": "Bogen",                  "ru": "Дуга"},
        "angleOffset":      {"en": "Angle offset",      "de": "Winkeloffset",           "ru": "Сдвиг дуги"},
        "angleArc":         {"en": "Angle arc",         "de": "Bogenwinkel",            "ru": "Угол дуги"},
        "displayPrevious":  {"en": "Display previous",  "de": "Letztes Wert zeigen",    "ru": "Показывать предыдущее значение"},
        "cursor":           {"en": "Cursor",            "de": "Griff",                  "ru": "Ручка"},
        "thickness":        {"en": "Thickness",         "de": "Dicke",                  "ru": "Толщина"},
        "bgcolor":          {"en": "Background color",  "de": "Hintergrundfarbe",       "ru": "Цвет фона"},
        "linecap":          {"en": "Line cap",          "de": "Linienende",             "ru": "Округлое окончание"},
        "anticlockwise":    {"en": "Anticlockwise",     "de": "Gegenuhrzeigersinn",     "ru": "Против часовой стрелки"},
        "oid-battery":      {"en": "Battery object ID", "de": "Battery ObjektID",       "ru": "ID батарейного индикатора"},
        "oid-signal":       {"en": "Signal object ID",  "de": "Signal ObjektID",        "ru": "ID качества сигнала"},
        "oid-humidity":     {"en": "Humidity ID",       "de": "Luftfeuchtigkeit ID",    "ru": "ID влажности"},
        "oid-drive":        {"en": "Valve ID",          "de": "Ventil ID",              "ru": "ID вентиля"},
        "oid-actual":       {"en": "Actual temperature ID", "de": "Ist ID",             "ru": "ID актуальной температуры"},
        "group_chart":      {"en": "Chart",             "de": "Grafik",                 "ru": "График"},
        "dialog_effect":    {"en": "Show effect",       "de": "Anzeigeeffekt",          "ru": "Эффект открытия"},
        "dialog_timeout":   {"en": "Hide timeout(ms)",  "de": "Zumachen nach(ms)",      "ru": "Закрыть после(мс)"},
        "dialog_open":      {"en": "Test open",         "de": "Testen",                 "ru": "Тест"},
        "border_width":     {"en": "Border width",      "de": "Rahmenbreite",           "ru": "border_width"},
        "slide_count":      {"en": "Slides count",      "de": "Flügelanzahl",           "ru": "slide_count"},
        "hide_timeout":     {"en": "Timeout for hide",  "de": "Timeout für ", "ru": "hide_timeout"},
        "group_slides":     {"en": "Slides",            "de": "group_slides", "ru": "group_slides"},
        "slide_type":       {"en": "Slide type",        "de": "slide_type", "ru": "slide_type"},
        "slide_sensor":     {"en": "Slide sensor",      "de": "slide_sensor", "ru": "slide_sensor"},
        "slide_sensor_lowbat": {"en": "Slide sensor lowbat", "de": "slide_sensor_lowbat", "ru": "slide_sensor_lowbat"},
        "slide_handle":     {"en": "Slide handle",      "de": "slide_handle", "ru": "slide_handle"},
        "slide_handle_lowbat": {"en": "slide_handle_lowbat", "de": "slide_handle_lowbat", "ru": "slide_handle_lowbat"}
    });
}

$.extend(true, systemDictionary, {
    "just&nbsp;now":  {"en": "just&nbsp;now", "de": "gerade&nbsp;jetzt", "ru": "только&nbsp;что"},
    "for&nbsp;%s&nbsp;min.":  {"en": "for&nbsp;%s&nbsp;min.", "de": "vor&nbsp;%s&nbsp;Min.", "ru": "%s&nbsp;мин. назад"},
    "for&nbsp;%s&nbsp;hr.&nbsp;and&nbsp;%s&nbsp;min.": {
        "en": "for&nbsp;%s&nbsp;hr.&nbsp;and&nbsp;%s&nbsp;min.",
        "de": "vor&nbsp;%s&nbsp;St.&nbsp;und&nbsp;%s&nbsp;Min.",
        "ru": "%s&nbsp;часов&nbsp;и&nbsp;%s&nbsp;мин. назад"
    },
    "yesterday":              {"en": "yesterday", "de": "gestern", "ru": "вчера"},
    "for&nbsp;%s&nbsp;hours": {"en": "for&nbsp;%s&nbsp;hours", "de": "vor&nbsp;%s&nbsp;Stunden", "ru": "%s&nbsp;часов назад"},
    "Chart":                  {"en": "Chart",     "de": "Grafik",  "ru": "График"},
});
// widget can has following parts:
// left info (descriptionLeft)
// right info (additional info)
// working/cancel icon
// center icon
// main form
// <div class="vis-widget-body">
//     <div class="vis-hq-rightinfo" style='position: absolite; z-index: 0"></div>
//     <div class="vis-hq-leftinfo"  style='position: absolite; z-index: 0"></div>
//     <div class="vis-hq-main"      style='z-index: 1">
//          <div class="vis-hq-icon" style='z-index: 1"></div>
//          <div class="vis-hq-text" style='z-index: 1"></div>
//     </div>
//     <div class="vis-hq-info-icon"  style='position: absolite; z-index: 2"></div>
// </div>

vis.binds.hqwidgets = {
    getTimeInterval: function (oldTime, hoursToShow) {
        var result = '';

        var newTime = new Date ();

        if (!oldTime) return '';
        if (typeof oldTime == 'string') {
            oldTime = new Date(oldTime);
        } else {
            if (typeof oldTime == 'number') oldTime = new Date(oldTime * 1000);
        }

        var seconds = (newTime.getTime() - oldTime.getTime ()) / 1000;

        if (hoursToShow && (seconds / 3600) > hoursToShow) return '';

        if (seconds < 60) {
            result = _('just&nbsp;now');
        } else
        if (seconds <= 3600)
            result = _('for&nbsp;%s&nbsp;min.', Math.floor (seconds / 60));
        else
        if (seconds <= 3600 * 24)
            result = _('for&nbsp;%s&nbsp;hr.&nbsp;and&nbsp;%s&nbsp;min.', Math.floor (seconds / 3600), (Math.floor (seconds / 60) % 60));
        else
        if (seconds > 3600 * 24 && seconds <= 3600 * 48)
            result = _('yesterday');
        else
        if (seconds > 3600*48) {
            result = _('for&nbsp;%s&nbsp;hours', Math.floor (seconds / 3600));
        }

        return result;
    },
    button: {
        showRightInfo: function ($div, value) {
            var data = $div.data('data');

            var time  = null;
            var timer = null;
            if (data.hoursLastAction) {
                // show time interval. It must be updated every minute
                if (data.timeAsInterval) {
                    time = vis.binds.hqwidgets.getTimeInterval(data.lc, data.hoursLastAction);
                    $div.find('.vis-hq-time').html(time);
                    if (!vis.editMode) {
                        timer = $div.data('lastTimer');
                        if (!timer) {
                            timer = setInterval(function () {
                                var time = vis.binds.hqwidgets.getTimeInterval(data.lc, data.hoursLastAction);
                                $div.find('.vis-hq-time').html(time);

                                if (time && $div.find('.vis-hq-time').text()){
                                    $div.find('.vis-hq-rightinfo').show();
                                } else {
                                    $div.find('.vis-hq-rightinfo').hide();
                                }
                            }, 60000);

                            $div.data('lastTimer', timer);
                        }
                    }

                } else {
                    // Show static date
                    time = vis.binds.basic.formatDate(data.lc, true, data.format_date);
                    $div.find('.vis-hq-time').html(time);
                }
            }

            // Kill timer if not required
            if (!timer) {
                var t = $div.data('lastTimer');
                if (t) clearTimeout(t);
            }

            // Set number value
            var text = null;
            if (data.wType == 'number') {
                var html = ((value === undefined || value === null) ? data.min : value) + ((data.unit === undefined) ? '' : data.unit);
                if (data.drive !== undefined) {
                    html += '<br><span class="vis-hq-drive">' + data.drive + '</span>%';
                }
                text = $div.find('.vis-hq-rightinfo-text').html(html);
            }

            // Hide right info if empty
            if (data.infoRight || time || (text && text.text())) {
                $div.find('.vis-hq-rightinfo').show();
            } else {
                $div.find('.vis-hq-rightinfo').hide();
            }

        },
        showCenterInfo: function ($div, isHide) {
            var data = $div.data('data');
            if (!data) return;

            if (data.humidity !== undefined || data.actual !== undefined) {
                if (isHide) {
                    $div.find('.vis-hq-centerinfo').hide();
                    $div.find('.vis-hq-middle').css('opacity', 1);
                } else {
                    if (!$div.find('.vis-hq-centerinfo').length) {
                        var text = '<table class="vis-hq-centerinfo hq-no-space" style="z-index: 2;position: absolute;">';

                        if (data.actual !== undefined) {
                            text += '<tr class="vis-hq-actual-style hq-no-space"><td class="hq-no-space"><span class="vis-hq-actual"></span>' + ((data.unit === undefined) ? '' : data.unit) + '</tr>';
                        }
                        if (data.humidity !== undefined) {
                            text += '<tr class="vis-hq-humidity-style hq-no-space"><td class="hq-no-space"><span class="vis-hq-humidity"></span>%</td></tr>';
                        }

                        text += '</table>';
                        $div.find('.vis-hq-main').prepend(text);
                    } else {
                        $div.find('.vis-hq-centerinfo').show();
                    }
                    $div.find('.vis-hq-middle').css('opacity', 0.7);
                    if (data.actual !== undefined) {
                        $div.find('.vis-hq-actual').html((data.digits !== null) ? data.actual.toFixed(data.digits) : data.actual);
                    }

                    if (data.humidity !== undefined) {
                        $div.find('.vis-hq-humidity').html(Math.round(data.humidity));
                    }

                    var $center = $div.find('.vis-hq-centerinfo');
                    var $main   = $div.find('.vis-hq-main');
                    if ($center.length) {
                        $center.css({
                            'top':  ($main.height() - $center.height()) / 2,
                            'left': ($main.width()  - $center.width())  / 2
                        });
                    }
                }
            }
        },
        // Calculate state of button
        changeState: function ($div, isInit, isForce, isOwn) {
            var data = $div.data('data');
            if (!data) return;

            var value = (data.tempValue !== undefined) ? data.tempValue : data.value;

            if (!isForce && data.oldValue !== undefined && data.oldValue == value) return;

            data.oldValue = value;

            if (data.temperature  ||
                value == data.min ||
                value === null    ||
                value === ''      ||
                value === undefined ||
                value === 'false' ||
                value === false) {
                data.state = 'normal';
            } else {
                data.state = 'active';
            }

            if (vis.editMode && data.testActive) {
                data.state = (data.state == 'normal') ? 'active' : 'normal';
            }

            if (value !== null && value !== undefined) {
                $div.find('.vis-hq-nodata').remove();
            }
            switch (data.state) {
                case 'normal':
                    $('#' + data.wid + ' .vis-hq-main')
                        .removeClass(data.styleActive)
                        .addClass(data.styleNormal);

                    if (data.iconName || data.iconOn) {
                        $div.find('.vis-hq-icon-img').attr('src', (data.iconName || ''));
                    }
                    break;
                case 'active':
                    $('#' + data.wid + ' .vis-hq-main')
                        .removeClass(data.styleNormal)
                        .addClass(data.styleActive);

                    if (data.iconName || data.iconOn) {
                        $div.find('.vis-hq-icon-img').attr('src', (data.iconOn || data.iconName));
                    }

                    break;
            }

            vis.binds.hqwidgets.button.showRightInfo($div, value);

            if (!data.ack || (data['oid-working'] && data.working)) {
                $div.find('.vis-hq-working').show();
            } else {
                $div.find('.vis-hq-working').hide();
            }

            if (data['oid-battery']) $div.batteryIndicator('show', data.battery || false);

            if (data['oid-signal']) {
                $div.find('.vis-hq-signal').html(data.signal);
            }

            if (data['oid-humidity']) {
                $div.find('.vis-hq-humidity').html(Math.round(data.humidity));
            }

            if (data['oid-actual']) {
                $div.find('.vis-hq-actual').html((data.digits !== null) ? data.actual.toFixed(data.digits) : data.actual);
            }

            if (data['oid-drive']) {
                $div.find('.vis-hq-drive').html(data.drive);
            }

            // Show change effect
            if (data.changeEffect && ((!isInit && !isOwn) || (vis.editMode && data.testActive))) {
                var $main = $div.find('.vis-hq-main');
                $main.animateDiv(data.changeEffect, {color: data.waveColor});
            }
        },
        changedId: function (widgetID, view, newId, attr, isCss) {
            var obj = vis.objects[newId];
            var changed = [];
            // If it is real object and SETPOINT
            if (obj && obj.common) {
                var roles = [];
                // If some attributes are not set
                if (!vis.views[view].widgets[widgetID].data['oid-battery']) roles.push('indicator.battery');
                if (!vis.views[view].widgets[widgetID].data['oid-working']) roles.push('indicator.working');
                if (!vis.views[view].widgets[widgetID].data['oid-signal'])  roles.push('indicator.signal');

                if (roles.length) {
                    var result = vis.findByRoles(newId, roles);
                    if (result) {
                        var name;
                        for (var r in result) {
                            switch (r) {
                                case  'indicator.battery':
                                    name = 'oid-battery';
                                    break
                                case  'indicator.working':
                                    name = 'oid-working';
                                    break
                                case  'indicator.signal':
                                    name = 'oid-signal';
                                    break
                                default:
                                    name = '';
                                    break;
                            }
                            if (name) {
                                changed.push(name);
                                vis.views[view].widgets[widgetID].data[name] = result[r];
                                vis.widgets[widgetID].data[name] = result[r];
                            }
                        }
                    }
                }
            }

            return changed.length ? changed : null;
        },
        draw: function ($div) {
            var data = $div.data('data');
            data.state = data.state || 'normal';
            var radius = $div.css('borderRadius') || vis.views[data.view].widgets[data.wid].style['border-radius'];

            // place left-info, right-info, caption and image
            if (!$div.find('.vis-hq-main').length) {
                var text = '';
                if (data.descriptionLeft) {
                    text += '<div class="vis-hq-leftinfo" style="padding-left: 15px; padding-right:50px; font-size: ' + (data.infoLeftFontSize || 12) + 'px"><span class="vis-hq-leftinfo-text">' +
                        (data.descriptionLeft || '').replace(/\s/g, '&nbsp;').replace(/\\n/g, '<br>') + '</span></div>\n';
                }
                if (data.infoRight || data.wType == 'number' || data.hoursLastAction) {
                    text += '<div class="vis-hq-rightinfo" style="padding-right: 15px; font-size: ' + (data.infoFontRightSize || 12) + 'px"><span class="vis-hq-rightinfo-text">' +
                        (data.infoRight || '').replace(/\s/g, '&nbsp;').replace(/\\n/g, '<br>') + '</span>';

                    if (data.hoursLastAction) {
                        if (data.infoRight || data.wType == 'number') text += '<br>';
                        text += '<span class="vis-hq-time"></span>';
                    }

                    text += '</div>\n';
                }
                text += '<div class="vis-hq-main" style="z-index: 1"><div class="vis-hq-middle">\n';

                if (data.offsetAuto) {
                    text += '<table class="vis-hq-table hq-no-space" style="position: absolute"><tr class="hq-no-space"><td class="hq-no-space"><div class="vis-hq-icon" style="text-align: center;"></div></td>\n';
                } else {
                    text += '<table class="vis-hq-table hq-no-space" style="position: absolute;top:' + data.topOffset + '%;left:' + data.leftOffset + '%"><tr class="hq-no-space"><td class="hq-no-space"><div class="vis-hq-icon" style="text-align: center;"></div></td>\n';
                }

                if (data.caption) {
                    if ($div.height() > $div.width()) text += '</tr><tr class="hq-no-space">';
                    text += '<td class="hq-no-space"><div class="vis-hq-text-caption" style="text-align: center;"></div></td>';
                }

                text += '</tr></table></div></div></div>';
                $div.append(text);
            }

            // Get the border radius from parent
            var $main = $div.find('.vis-hq-main');
            $main.css({borderRadius: radius});
            $div.find('.vis-hq-text-caption').html(data.caption || '');

            var width = $div.width();
            var offset = width - 20 - parseInt(radius, 10);
            if (offset < width / 2) offset = width / 2;
            $div.find('.vis-hq-leftinfo').css({right: offset + 'px'});
            $div.find('.vis-hq-rightinfo').css({'padding-left': 5 + (width / 2) + 'px'});

            // Place icon
            var img = null;
            if (data.iconName || data.iconOn) {
                img = (data.state == 'normal') ? (data.iconName || ''): (data.iconOn || '');
                $div.find('.vis-hq-icon').html('<img class="vis-hq-icon-img" style="height: ' + data.btIconWidth + 'px; width: auto;" src="' + img + '"/>')
            } else {
                $div.find('.vis-hq-icon').html('');
            }

            if (data['oid-battery']) $div.batteryIndicator();

            if (data['oid-working']) {
                $div.append('<div class="vis-hq-working"><span class="ui-icon ui-icon-gear"></span></div>');
            }

            // find the right position for image and caption in the middle
            if (data.offsetAuto) {
                var $middle = $div.find('.vis-hq-table');
                $middle.css({
                    left: ($main.width()  - $middle.width()) / 2,
                    top:  ($main.height() - $middle.height()) / 2
                });
                if (img) {
                    $div.find('.vis-hq-icon-img').load(function () {
                        var $middle = $div.find('.vis-hq-table');
                        $middle.css({
                            left: ($main.width()  - $middle.width()) / 2,
                            top:  ($main.height() - $middle.height()) / 2
                        });
                    });
                }
            }

            // action
            if (1 || !vis.editMode) {
                if (data.oid) {

                    $div.append('<div class="vis-hq-nodata"><span class="ui-icon ui-icon-cancel"></span></div>');

                    vis.states.bind(data.oid + '.val', function (e, newVal, oldVal) {
                        data.value = newVal;
                        data.ack   = vis.states[data.oid + '.ack'];
                        data.lc    = vis.states[data.oid + '.lc'];

                        if (data.wType == 'number') {
                            if (newVal === false || newVal === 'false') data.value = data.min;
                            if (newVal === true  || newVal === 'true')  data.value = data.max;
                        }

                        vis.binds.hqwidgets.button.changeState($div);

                        if (data.wType == 'number') {
                            $main.scala('value', data.value);
                        }
                    });
                }

                if (data['oid-working']) {
                    vis.states.bind(data['oid-working'] + '.val', function (e, newVal, oldVal) {
                        data.working = newVal;
                        vis.binds.hqwidgets.button.changeState($div, false, true);
                    });
                }

                if (data['oid-battery']) {
                    vis.states.bind(data['oid-battery'] + '.val', function (e, newVal, oldVal) {
                        data.battery = newVal;
                        vis.binds.hqwidgets.button.changeState($div, false, true);
                    });
                }

                if (data['oid-signal']) {
                    vis.states.bind(data['oid-signal'] + '.val', function (e, newVal, oldVal) {
                        data.signal = newVal;
                        vis.binds.hqwidgets.button.changeState($div, false, true);
                    });
                }

                if (data['oid-humidity']) {
                    vis.states.bind(data['oid-humidity'] + '.val', function (e, newVal, oldVal) {
                        data.humidity = newVal;
                        vis.binds.hqwidgets.button.changeState($div, false, true);
                    });
                }

                if (data['oid-actual']) {
                    vis.states.bind(data['oid-actual'] + '.val', function (e, newVal, oldVal) {
                        data.actual = newVal;
                        vis.binds.hqwidgets.button.changeState($div, false, true);
                    });
                }

                if (data['oid-drive']) {
                    vis.states.bind(data['oid-drive'] + '.val', function (e, newVal, oldVal) {
                        data.drive = newVal;
                        vis.binds.hqwidgets.button.changeState($div, false, true);
                    });
                }
            }

            // initiate state
            vis.binds.hqwidgets.button.changeState($div, true);

            // If dimmer or number
            if (data.wType == 'number') {
                var scalaOptions = {
                    change:     function (value) {
                        data.value = parseFloat(value);

                        if (data.digits !== null) data.value = data.value.toFixed(data.digits);
                        if (data.is_comma)        data.value = data.value.toString().replace('.', ',');

                        data.value     = parseFloat(data.value);
                        data.ack       = false;
                        data.tempValue = undefined;

                        vis.binds.hqwidgets.button.changeState($div, false, false, true);
                        vis.setValue(data.oid, data.value);
                    },
                    min:        data.min,
                    max:        data.max,
                    changing:   function (value) {
                        data.tempValue = value;
                        if (data.digits !== null) data.tempValue = data.tempValue.toFixed(data.digits);
                        if (data.is_comma) data.tempValue = data.tempValue.toString().replace('.', ',');
                        data.tempValue = parseFloat(data.tempValue);
                        vis.binds.hqwidgets.button.changeState($div, false, false, true);
                    },
                    click:      function (val) {
                        val = data.value;
                        if (!data.temperature) {
                            if (val - data.min > ((data.max - data.min) / 2)) {
                                val = data.min;
                            } else {
                                val = data.max;
                            }
                        } else {
                            data.tempValue = undefined;
                            vis.binds.hqwidgets.button.changeState($div, false, false, true);

                            // Show dialog
                            if (data.url) $div.popupDialog('show');
                        }
                        return val;
                    },
                    alwaysShow: data.alwaysShow,
                    onshow:     function () {
                        if (!data.alwaysShow) {
                            vis.binds.hqwidgets.button.showCenterInfo($div, true);
                        }
                    },
                    onhide:     function (){
                        vis.binds.hqwidgets.button.showCenterInfo($div);
                    },
                    hideNumber: !data.showValue || (data.temperature && data.alwaysShow),
                    readOnly:   vis.editMode,
                    width:      ((100 + parseInt(data.circleWidth || 50, 10)) * width / 100).toFixed(0)
                };

                // show for temperature color depends on value
                if (data.temperature) {
                    vis.binds.hqwidgets.button.showCenterInfo($div);

                    scalaOptions.color = 'black';
                    scalaOptions.colorize = function (color, value, isPrevious) {
                        var ratio = (value - data.min) / (data.max - data.min);
                        return 'hsla(' + (180 + Math.round(180 * ratio)) + ', 70%, 50%, ' + ((isPrevious) ? 0.7 : 0.9) + ')';
                    }
                }
                $main.scala(scalaOptions);
                $main.scala('value', data.value);
            } else {
                if (!vis.editMode && data.oid) {
                    $main.on('click touchstart', function () {
                        // Protect against two events
                        var now = (new Date()).getTime();
                        var lastClick = $(this).data('lc');
                        if (lastClick && now - lastClick < 50) return;
                        $(this).data('lc', now);

                        data.value = (data.state == 'normal') ? data.max : data.min;
                        data.ack   = false;
                        vis.binds.hqwidgets.button.changeState($div, false, false, true);
                        vis.setValue(data.oid, data.value);
                    });
                }
            }

            //Chart dialog
            if (data.url/* && !vis.editMode*/) {
                $div.popupDialog({
                    content: '<iframe src="' + data.url + '" style="width: 100%; height: calc(100% - 5px); border: 0"></iframe>',
                    width:   data.dialog_width,
                    height:  data.dialog_height,
                    effect:  data.dialog_effect,
                    timeout: data.dialog_timeout,
                    modal:   data.dialog_modal,
                    title:   data.dialog_title || data['oid-actual'],
                    open:    data.dialog_open && vis.editMode
                });
            }
        },
        init: function (wid, view, data, style, wType) {
            var $div = $('#' + wid).addClass('hq-button-base');
            if (!$div.length) {
                setTimeout(function () {
                    vis.binds.hqwidgets.button.init(wid, view, data, style, wType);
                }, 100);
                return;
            } else {
                /*var timer = $('#' + wid).data('timer');
                if (!timer) {
                    $('#' + wid).data('timer', function () {
                        vis.binds.hqwidgets.button.init(wid, view, data, style, wType);
                    });
                } else {
                    $('#' + wid).data('timer', null);
                }*/
            }
            var _data = {wid: wid, view: view, wType: wType};
            for (var a in data) {
                if (!data.hasOwnProperty(a) || typeof data[a] == 'function') continue;
                if (a[0] != '_') {
                    _data[a] = data[a];
                }
            }
            data = _data;

            data.styleNormal = data.usejQueryStyle ? 'ui-state-default' : (data.styleNormal || 'hq-button-base-normal');
            data.styleActive = data.usejQueryStyle ? 'ui-state-active'  : (data.styleActive || 'hq-button-base-on');
            data.min = (data.min === 'true' || data.min === true) ? true : ((data.min === 'false' || data.min === false) ? false : ((data.min !== undefined) ? parseFloat(data.min) : 0));
            data.max = (data.max === 'true' || data.max === true) ? true : ((data.max === 'false' || data.max === false) ? false : ((data.max !== undefined) ? parseFloat(data.max) : 100));
            data.digits = (data.digits || data.digits === 0) ? parseInt(data.digits, 10) : null;

            $div.data('data',  data);
            $div.data('style', style);

            if (data.oid) {
                data.value = vis.states.attr(data.oid + '.val');
                data.ack   = vis.states.attr(data.oid + '.ack');
                data.lc    = vis.states.attr(data.oid + '.lc');
            }

            if (data['oid-working'])  data.working  = vis.states.attr(data['oid-working']  + '.val');
            if (data['oid-battery'])  data.battery  = vis.states.attr(data['oid-battery']  + '.val');
            if (data['oid-signal'])   data.signal   = vis.states.attr(data['oid-signal']   + '.val');
            if (data['oid-humidity']) data.humidity = vis.states.attr(data['oid-humidity'] + '.val');
            if (data['oid-actual'])   data.actual   = vis.states.attr(data['oid-actual']   + '.val');
            if (data['oid-drive'])    data.drive    = vis.states.attr(data['oid-drive']    + '.val');

            vis.binds.hqwidgets.button.draw($div);
        }
    },
    window: {
        drawOneWindow: function (index, options) {
            var bWidth = options.border_width;
            var div1 = '<div class="hq-blind-blind1" style="' +
                'border-width: ' + bWidth + 'px;' + //'px 2px 2px 2px; ' +
                'border-color: #a9a7a8;' +
                '">';

            var div2 = '<div class="hq-blind-blind2" style="' +
                'border-width: ' + bWidth + 'px; ' +
                '">';

            var div3 = '<div class="hq-blind-blind3"><table class="hq-no-space" style="width: 100%; height: 100%; position: absolute"><tr class="hq-no-space hq-blind-position" style="height: ' + options.shutterPos + '%"><td class="hq-no-space hq-blind-blind"></td></tr><tr class="hq-no-space"><td class="hq-no-space"></td></tr></table>';

            var hanldePos  = null;
            var slidePos   = null;

            if (options.handleOid) {
                hanldePos = vis.states[options.handleOid + '.val'];
                slidePos = hanldePos;
            }
            if (options.slideOid) {
                slidePos = vis.states[options.slideOid + '.val'];
                if (!options.handleOid) hanldePos = slidePos;
            }
            if (options.oid) {

            }


            var div4 = '<div class="hq-blind-blind4';
            if ((slidePos == 1 || slidePos === true || slidePos === 'true' || slidePos === 'open' || slidePos === 'opened') && options.type) {
                div4 +=' hq-blind-blind4-opened-' + options.type;
            }
            if ((slidePos == 2 || slidePos === 'tilt' || slidePos === 'tilted') && options.type) {
                div4 +=' hq-blind-blind4-tilted';
            }
            options.shutterPos = options.shutterPos || 0;
            div4 +='" style="' +
                'border-width: ' + bWidth + 'px;' + //'3px 1px 1px 1px;' +
                'border-color: #a5aaad;' +
                '">';

            var div5 = '';

            if (options.type) {
                div5 = '<div class="hq-blind-handle hq-blind-handle-bg';
                if (hanldePos == 2 || hanldePos === 'tilt' || hanldePos === 'tilted') {
                    div5 += ' hq-blind-handle-tilted-bg';
                }
                var bbWidth = Math.round(bWidth / 3);
                if (bbWidth < 1) bbWidth = 1;
                div5 += '" style="border-width: ' + bbWidth + 'px;';
                if (options.type == 'left' || options.type == 'right') {
                    div5 += 'top: 50%;	width: ' + bWidth + 'px; height: 15%;'
                } else if (options.type == 'top' || options.type == 'bottom') {
                    div5 += 'left: 50%; height: ' + bWidth + 'px; width: 15%;'
                }
                if (options.type == 'right') {
                    div5 += 'left: calc(100% - ' + (bbWidth * 2 + bWidth) + 'px);'
                } else if (options.type == 'bottom') {
                    div5 += 'top: calc(100% - ' + (bbWidth * 2 + bWidth) + 'px);'
                }

                if (hanldePos) {
                    var format =
                        '-moz-transform-origin: ------;' +
                        '-ms-transform-origin: ------;' +
                        '-o-transform-origin: ------;' +
                        '-webkit-transform-origin: ------;' +
                        'transform-origin: ------;' +
                        '-moz-transform: rotate(DDDdeg);' +
                        '-ms-transform: rotate(DDDdeg);' +
                        '-o-transform: rotate(DDDdeg);' +
                        '-webkit-transform: rotate(DDDdeg);' +
                        'transform: rotate(DDDdeg);';

                    var w = Math.round(bbWidth + bWidth / 2);
                    if (options.type == 'left' || options.type == 'bottom') {
                        if (hanldePos == 1 || hanldePos === true || hanldePos === 'true' || hanldePos === 'open' || hanldePos === 'opened') {
                            div5 += format.replace(/------/g, w + 'px ' + w + 'px').replace(/DDD/g, '-90');
                        } else if (hanldePos == 2 || hanldePos === 'tilt' || hanldePos === 'tilted') {
                            div5 += format.replace(/------/g, w + 'px ' + w + 'px').replace(/DDD/g, '180');
                        }
                    } else {
                        if (hanldePos == 1 || hanldePos === true || hanldePos === 'true' || hanldePos === 'open' || hanldePos === 'opened') {
                            div5 += format.replace(/------/g, w + 'px ' + w + 'px').replace(/DDD/g, '90');
                        } else if (hanldePos == 2 || hanldePos === 'tilt' || hanldePos === 'tilted') {
                            div5 += format.replace(/------/g, w + 'px ' + w + 'px').replace(/DDD/g, '180');
                        }
                    }
                }

                div5 += '"></div>';
            }


            var text = div1 + div2 + div3 + div4 + div5 + '</div></div></div></div></div>';

            return text;
        },
        hidePopup: function ($div) {
            var data = $div.data('data');
            if (!data) return;

            var $big = $div.find('.hq-blind-big');
            if (data.noAnimate) {
                //$big.makeSlider('hide');
                setTimeout(function () {
                    $big.find('.hq-blind-big-slider').makeSlider('hide');
                    $big.hide();
                    $big.data('show', false);
                }, 200);
            } else {
                $big.animate({width: $div.width(), height: $div.height(), opacity: 0, top: 0, left: 0}, 500, 'swing', function () {
                    $big.find('.hq-blind-big-slider').makeSlider('hide');
                    $big.hide();
                    $big.data('show', false);
                });
            }

        },
        openPopup: function ($div) {
            var data = $div.data('data');
            if (!data) return;
            var $big = $div.find('.hq-blind-big');
            if (!$big.length) {
                var text = '<table class="hq-blind-big hq-no-space" style="display:none">' +
                    '    <tr><td><div class="hq-blind-big-button hq-blind-big-button-up"></div></td></tr>' +
                    '    <tr style="height: 100%"><td><div class="hq-blind-big-slider"></div></td></tr>' +
                    '    <tr><td><div class="hq-blind-big-button hq-blind-big-button-down"></div></td></tr>' +
                    '</table>';
                $div.append(text);
                $div.find('.hq-blind-big-slider').makeSlider({
                    max:      data.max,
                    min:      data.min,
                    invert:   !data.invert,
                    show:     false,
                    relative: true,
                    value:    data.value,
                    timeout:  data.hide_timeout
                }, function (newValue) {
                    vis.setValue(data.oid, newValue);
                    vis.binds.hqwidgets.window.hidePopup($div);
                }, function () {
                    vis.binds.hqwidgets.window.hidePopup($div);
                });
                $div.find('.hq-blind-big-button-down').click(function () {
                    vis.setValue(data.oid, data.invert ? data.min : data.max);
                    vis.binds.hqwidgets.window.hidePopup($div);
                });
                $div.find('.hq-blind-big-button-up').click(function () {
                    vis.setValue(data.oid, data.invert ? data.max : data.min);
                    vis.binds.hqwidgets.window.hidePopup($div);
                });
                $big = $div.find('.hq-blind-big');
            }

            $big.data('show', true);

            if (data.bigLeft === undefined) {
                var pos = $div.position();
                var w   = $div.width();
                var h   = $div.height();

                data.bigWidth  = $big.width();
                data.bigHeight = $big.height();
                data.bigLeft   = Math.round((w - data.bigWidth) / 2);
                data.bigTop    = Math.round((h - data.bigHeight) / 2);

                if (pos.top  + data.bigTop < 0)  data.bigTop  = -pos.top;
                if (pos.left + data.bigLeft < 0) data.bigLeft = -pos.left;
            }

            $big.css({top: data.bigTop, left: data.bigLeft});

            if (data.noAnimate) {
                $big.find('.hq-blind-big-slider').makeSlider('show', data.value);
                $big.show();
            } else {
                $big.css({top:0, left: 0, width: $div.width(), height: $div.height(), opacity: 0}).show();
                $big.find('.hq-blind-big-slider').makeSlider('show', data.value);
                $big.animate({top: data.bigTop, left: data.bigLeft, width: data.bigWidth, height: data.bigHeight, opacity: 1}, 500);
            }
        },
        draw: function ($div) {
            var data = $div.data('data');
            if (!data) return;

            $div.css({'padding-top': data.border_width, 'padding-bottom' : data.border_width - 1, 'padding-right': data.border_width + 1, 'padding-left': data.border_width + 1});

            // get position
            data.shutterPos = 0;
            if (data.oid) {
                data.value      = vis.states[data.oid + '.val'];
                data.shutterPos = data.value;
                if (data.shutterPos === undefined || data.shutterPos === null) {
                    data.shutterPos = 0;
                } else {
                    if (data.shutterPos < data.min) data.shutterPos = data.min;
                    if (data.shutterPos > data.max) data.shutterPos = data.max;

                    data.shutterPos = Math.round(100 * (data.shutterPos - data.min) / (data.max - data.min));
                }
                if (data.invert) data.shutterPos = 100 - data.shutterPos;
            }

            var text = '<table class="hq-blind hq-no-space" style="width: 100%; height: 100%"><tr>';
            for (var i = 1; i <= data.slide_count; i++) {
                var options = {
                    slideOid:     data['slide_sensor' + i],
                    handleOid:    data['slide_handle' + i],
                    type:         data['slide_type' + i],
                    border_width: data.border_width,
                    shutterPos:   data.shutterPos
                };
                text += '<td>' + this.drawOneWindow(i, options, 'closed') + '</td>';
            }
            text += '</tr></table>';
            $div.html(text);
            var i = 0;
            $div.find('.hq-blind-blind2').each(function (id) {
                id++;
                if (data['slide_sensor_lowbat' + id]) {
                    data.slide_sensor_lowbat[id] = vis.states[data['slide_sensor_lowbat' + id] + '.val'];
                    $(this).batteryIndicator({
                        show:    data.slide_sensor_lowbat[id] || false,
                        title:   _('Low battery on sash sensor'),
                        classes: 'slide-low-battery'
                    });
                }
            });
            $div.find('.hq-blind-blind3').each(function (id) {
                id++;
                if (data['slide_handle_lowbat' + id]) {
                    data.slide_handle_lowbat[id] = vis.states[data['slide_handle_lowbat' + id] + '.val'];
                    $(this).batteryIndicator({
                        show:    data.slide_handle_lowbat[id] || false,
                        color:   '#FF55FA',
                        title:   _('Low battery on handle sensor'),
                        classes: 'handle-low-battery'
                    });
                    $(this).find('.handle-low-battery').css({top: 8});
                }
            });
        },

        init: function (wid, view, data, style) {
            var $div = $('#' + wid).addClass('hq-button-base');
            if (!$div.length) {
                setTimeout(function () {
                    vis.binds.hqwidgets.window.init(wid, view, data, style);
                }, 100);
                return;
            }
            var _data = {wid: wid, view: view};
            for (var a in data) {
                if (!data.hasOwnProperty(a) || typeof data[a] == 'function') continue;
                if (a[0] != '_') _data[a] = data[a];
            }
            data = _data;

            data.hide_timeout = (data.hide_timeout === 0 || data.hide_timeout === '0') ? 0 : (parseInt(data.hide_timeout, 10) || 2000);
            data.min          = ((data.min !== undefined) ? parseFloat(data.min) : 0);
            data.max          = ((data.max !== undefined) ? parseFloat(data.max) : 100);
            data.digits       = (data.digits || data.digits === 0) ? parseInt(data.digits, 10) : null;

            if (!data.border_width && data.border_width != '0') data.border_width = 3;
            data.border_width = parseInt(data.border_width, 10);

            $div.data('data',  data);
            $div.data('style', style);

            data.min = parseFloat(data.min);
            data.max = parseFloat(data.max);
            if (data.max < data.min) {
                var tmp  = data.min;
                data.min = data.max;
                data.max = tmp;
            }
            data.slide_sensor_lowbat = [];
            data.slide_handle_lowbat = [];

            if (data['oid-working'])  data.working  = vis.states.attr(data['oid-working']  + '.val');

            vis.binds.hqwidgets.window.draw($div);

            for (var i = 1; i <= data.slide_count; i++) {
                if (data['slide_sensor' + i]) {
                    vis.states.bind(data['slide_sensor' + i] + '.val', function () {
                        vis.binds.hqwidgets.window.draw($div);
                    });
                }
                if (data['slide_handle' + i]) {
                    vis.states.bind(data['slide_handle' + i] + '.val', function () {
                        vis.binds.hqwidgets.window.draw($div);
                    });
                }
                if (data['slide_sensor_lowbat' + i]) {
                    vis.states.bind(data['slide_sensor_lowbat' + i] + '.val', function (e, newVal, oldVal) {
                        for (var id = 1; id <= data.slide_count; id++) {
                            if (data['slide_sensor_lowbat' + id]) {
                                data.slide_sensor_lowbat[id] = vis.states[data['slide_sensor_lowbat' + id] + '.val'];
                            }
                        }

                        $div.find('.slide-low-battery').each(function (id) {
                            id++;
                            if (data['slide_sensor_lowbat' + id]) {
                                if (data.slide_sensor_lowbat[id]) {
                                    $(this).show();
                                } else {
                                    $(this).hide();
                                }
                            }
                        });
                    });
                }
                if (data['slide_handle_lowbat' + i]) {
                    vis.states.bind(data['slide_handle_lowbat' + i] + '.val', function () {
                        for (var id = 1; id <= data.slide_count; id++) {
                            if (data['slide_handle_lowbat' + id]) {
                                data.slide_handle_lowbat[id] = vis.states[data['slide_handle_lowbat' + id] + '.val'];
                            }
                        }
                        $div.find('.handle-low-battery').each(function (id) {
                            id++;
                            if (data['slide_handle_lowbat' + id]) {
                                if (data.slide_handle_lowbat[id]) {
                                    $(this).show();
                                } else {
                                    $(this).hide();
                                }
                            }
                        });
                    });
                }
            }

            if (data.oid) {
                if (!vis.editMode) {
                    // prepare big window
                    $div.click(function () {
                        var $big = $div.find('.hq-blind-big');
                        if (!$big.length || !$big.data('show')) {
                            vis.binds.hqwidgets.window.openPopup($div);
                        }
                    });
                }

                vis.states.bind(data.oid + '.val', function (e, newVal, oldVal) {
                    var shutterPos = newVal;
                    data.value = shutterPos;
                    if (shutterPos === undefined || shutterPos === null) {
                        data.shutterPos = 0;
                    } else {
                        if (shutterPos < data.min) shutterPos = data.min;
                        if (shutterPos > data.max) shutterPos = data.max

                        data.shutterPos = Math.round(100 * (shutterPos - data.min) / (data.max - data.min));
                    }

                    if (data.invert) data.shutterPos = 100 - data.shutterPos;

                    $div.find('.hq-blind-position').animate({'height': data.shutterPos + '%'}, 500);
                });
            }
        }
    },
    circle: {
        init: function (wid, view, data) {
            var $div = $('#' + wid);
            if (!$div.length) {
                setTimeout(function () {
                    vis.binds.hqwidgets.circle.init(wid, view, data);
                }, 100);
                return;
            }

            var settings = data;
            var $scalaInput = $div.find('input');
            $div.addClass('hq-button-base')

            if (settings.oid) {
                $scalaInput.val(vis.states.attr(settings.oid + '.val'));
                if (1 || !vis.editMode) {
                    vis.states.bind(settings.oid + '.val', function (e, newVal, oldVal) {
                        settings.value = newVal;
                        $scalaInput.val(settings.value).trigger('change');
                    });
                }
            } else {
                $scalaInput.val(settings.min);
            }

            var offset = settings.angleOffset;
            if (settings.angleArc !== undefined && !offset && offset !== 0 && offset !== '0') {
                offset = 180 + (360 - parseInt(settings.angleArc, 10)) / 2;
            }

            $scalaInput.attr('data-angleOffset', offset);
            $scalaInput.attr('data-angleArc',    settings.angleArc);
            $scalaInput.attr('data-thickness',   settings.thickness);
            $scalaInput.attr('data-linecap',     (settings.linecap === 'true' || settings.linecap === true) ? 'round' : 'butt');
            $scalaInput.show();
            var $knobDiv = $scalaInput.knob({
                width:   parseInt($div.width(),  10),
                height:  parseInt($div.height(), 10),
                release: function () {
                    // remove unit
                    var oldValue = $scalaInput.data('oldValue');
                    var val = $scalaInput.val();

                    if ((settings.unit || settings.unit === 0) && val.substring(val.length - settings.unit.length, val.length) == settings.unit) {
                        val = val.substring(0, val.length - settings.unit.length);
                    }
                    if (oldValue != val && !vis.editMode && settings.oid) {
                        $scalaInput.data('oldValue', val);
                        vis.setValue(settings.oid, val);
                    }
                },
                cancel:  function () {
                },
                change:  function (value) {
                },
                format:  function (v) {
                    if (settings.unit) v = v + settings.unit;
                    return v;
                },
                displayPrevious : settings.displayPrevious,
                displayInput:     !settings.hideNumber,
                bgColor:          settings.bgcolor || undefined,
                readOnly:         settings.readOnly,
                fgColor:          settings.color,
                inputColor:       settings.color,
                colorize:         settings.colorize ? settings.colorize : undefined,
                min:              settings.min,
                max:              settings.max,
                step:             settings.step,
                cursor:           settings.cursor,
                rotation:         settings.anticlockwise ? 'anticlockwise' : 'clockwise'

            });
            if (settings.caption) {
                $scalaInput.after('<div style="position: absolute; left: 50%; top: 60%"><span style="position:relative; left: -50%" >' + settings.caption + '</span></div>');
            }

            $scalaInput.prop('readonly', true);
            var parentFont = $div.parent().css('font-size');
            var font       = $div.css('font-size');
            if (font != parentFont) $scalaInput.css('font-size', font);

            parentFont = $div.parent().css('font-weight');
            font       = $div.css('font-weight');
            if (font != parentFont) $scalaInput.css('font-weight', font);

            parentFont = $div.parent().css('font-style');
            font       = $div.css('font-style');
            if (font != parentFont) $scalaInput.css('font-style', font);

            parentFont = $div.parent().css('font-variant');
            font       = $div.css('font-variant');
            if (font != parentFont) $scalaInput.css('font-variant', font);
        }
    },
    checkbox: {
        init: function (wid, view, data) {
            var $div = $('#' + wid);
            if (!$div.length) {
                setTimeout(function () {
                    vis.binds.hqwidgets.checkbox.init(wid, view, data);
                }, 100);
                return;
            }

            var settings = {
                oid:           data.oid           || null,
                staticValue:   data.staticValue,
                checkboxSize:  data.checkboxSize  || 'big',
                checkboxColor: data.checkboxColor || 'orange',
                readOnly:      vis.editMode       || data.readOnly || false
            };
            if (settings.checkboxSize == 'small') {
                $div.css({width: '108px', height: '34px'});
            }

            if (!$div.find('input').length) $div.append('<input type="checkbox"/>');
            var $input = $div.find('input');

            var $shineCheckbox = $input.shineCheckbox(settings);
            if (settings.oid && settings.oid != 'nothing_selected') {
                $shineCheckbox.shineCheckbox('value', vis.states.attr(settings.oid + '.val'));

                vis.states.bind(settings.oid + '.val', function (e, newVal, oldVal) {
                    $shineCheckbox.shineCheckbox('value', newVal);
                });
                $div.find('input').change(function () {
                    vis.setValue(settings.oid, $(this).prop('checked'));
                });
            } else {
                $shineCheckbox.shineCheckbox('value', settings.staticValue);
            }
        }
    }
};