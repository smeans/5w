(function( $ ) {
  function daysInMonth(m, y) {
    return 32 - new Date(y, m, 32).getDate();
  }

  function getVal($dw, valname) {
    return parseInt($dw.find('.' + valname + ' .dwstrip div:first-child').text());
  }

  function setVal($dw, valname, val) {
    var $strip = $dw.find('.' + valname + ' .dwstrip');

    var c = $strip.children().length;

    while (c-- > 0 && parseInt($strip.children().first().text()) !== val) {
      rol($strip);
    }
  }

  function getPageX(e) {
    return e.originalEvent.pageX;
  }

  function getPageY(e) {
    return e.originalEvent.pageY;
  }

  function nextStrip($strip) {
    return $strip.parent().nextAll('div:first').find('.dwstrip');
  }

  function addDivs($target, className, start, end) {
    var $p = $('<div/>', {'class':className});
    var $c = $('<div/>', {'class':'dwstrip'});

    for (var i = start; i <= end; i++) {
      if (i == start) {
        $c.append($('<div/>', {text:'' + i, 'class':'dwfirst'}));
      } else {
        $c.append($('<div/>', {text:'' + i}));
      }
    }

    $p.append($c);
    $target.append($p);
  }

  function ror($strip) {
    var $s = $strip.children().last().remove();
    $strip.prepend($s);

    if ($($strip.children()[1]).hasClass('dwfirst')) {
      var $ns = nextStrip($strip);

      if ($ns) {
        ror($ns);
      }
    }

    return $s;
  }

  function rol($strip) {
    var $s = $strip.children().first().remove();
    $strip.append($s);

    if ($strip.children().first().hasClass('dwfirst')) {
      var $ns = nextStrip($strip);

      if ($ns) {
        rol($ns);
      }
    }

    return $s;
  }

  function adjustDays($dw) {
    var $strip = $('.dwd .dwstrip', $dw);
    var md = daysInMonth(getVal($dw, 'dwm')-1, getVal($dw, 'dwy'));
    var cd = $strip.children().length;

    if (md == cd) {
      return;
    }

    if (md > cd) {
      var $fd = $('.dwfirst', $strip);
      var $cs = $strip.children().first();

      for (var i = cd + 1; i <= md; i++) {
        var $nd = $fd.before($('<div/>', {text:i + ''}));
      }

      while (parseInt($strip.children().first().text()) != parseInt($cs.text())) {
        $strip.append($strip.children().first().remove());
      }
    } else {
      while (parseInt($strip.children().first().text()) > md) {
        $strip.prepend($strip.children().last().remove());
      }

      $('div', $strip).each(function () {
        var $this = $(this);

        if (parseInt($this.text()) > md) {
          $this.remove();
        }
      });
    }

  }

  function scrollStrip($strip, dx) {
    var nl = parseInt($strip.css('left')) + dx;
    var checkDays = false;
    var $dw = $strip.parents('.datewheel');
    var db = getVal($dw, 'dwy') * 100 + getVal($dw, 'dwm');

    while (nl > 0) {
      var $s = ror($strip);

      nl -= $s.outerWidth(true);

      adjustDays($dw);
    }

    while ($strip.children().first().is(':hidden')) {
      rol($strip);
    }

    while (nl < -$strip.children().first().outerWidth(true)) {
      var $s = rol($strip);

      nl += $s.outerWidth(true);

      adjustDays($dw);
    }

    $strip.css({left:nl});
  }

  var methods = {
     init : function( options ) {

       return this.each(function(){

         var $this = $(this),
              data = $this.data('datewheel');

          if (!data) {
            if (!options) {
              options = {};
            }

            defaults = {
                basedate: new Date(1970, 0, 1),
                date: new Date(),
                labels: ['m', 'h', 'd', 'm', 'y'],
                showTime: true
            };

            $.extend(defaults, options);

            options = defaults;

            $this.addClass('datewheel');

            var vl = [
              ['dwmin', 0, 59],
              ['dwh', 0, 23],
              ['dwd', 1, 31],
              ['dwm', 1, 12],
              ['dwy', options.basedate.getFullYear(), options.basedate.getFullYear() + 100]
            ];

            if ($('html.touch').length) {
              vl = [
                ['dwmin', 0, 59],
                ['dwh', 0, 23],
                ['dwd', 1, 31],
                ['dwm', 1, 12],
                ['dwy norepeat', options.basedate.getFullYear(), options.basedate.getFullYear() + 100]
              ];              
            }

            var lc = $('<div class="dwlc"/>');

            $.each(options.labels, function (i) {
              $(lc).append('<label class="' + vl[i][0] + '">' + this + '</label>');
            });

            $this.append(lc);

            var vc = $('<div class="dwvc"/>');

            $.each(vl, function () {
              addDivs(vc, this[0], this[1], this[2]);
            });

            $this.append(vc);

            if (!options.showTime) {
              $this.find('.dwmin, .dwh').hide();
            }

            $this.find('.dwstrip').css({left:0});

            if ($('html.touch').length) {
              $(document).on('tap', methods.click);
              $(document).bind('touchstart', methods.mousedown);
              $(document).bind('touchmove', methods.mousemove);
              $(document).bind('touchend', methods.mouseup);
            } else {
              $(document).bind('click', methods.click);
            }

            $this.data('datewheel', options);

            $this.datewheel('date', options.date);
          }
       });
     },
     date: function(newdate) {
        var $this = $(this);

        if (newdate == undefined) {
          return new Date(getVal($this, 'dwy'), getVal($this, 'dwm')-1, getVal($this, 'dwd'), getVal($this, 'dwh'), getVal($this, 'dwmin'));
        } else {
          if (!(newdate instanceof Date)) {
            newdate = new Date(newdate);
          }

          setVal($this, 'dwmin', newdate.getMinutes());
          setVal($this, 'dwh', newdate.getHours());
          setVal($this, 'dwd', newdate.getDate());
          setVal($this, 'dwm', newdate.getMonth()+1);
          setVal($this, 'dwy', newdate.getFullYear());

          $this.trigger('datewheel.changed');

          return newdate;
        }
     },
     click : function (event) {
      var $s = $(event.target);

      if (!$s.parent('.dwstrip').length) {
        return;
      }

      var $strip = $($(event.target).closest('.dwstrip')[0]);

      if ($strip.length) {
        setVal($strip.parents('.datewheel'), $strip.parent().attr('class'), parseInt($s.text()));

        $(event.target).closest('.datewheel').trigger('datewheel.changed');
      }
     },
     mousedown : function (event) {
      var $strip = $($(event.target).closest('.dwstrip')[0]);

      if ($strip.length) {
        $.fn.datewheel.capture = $($(event.target).closest('.datewheel')[0]);
        var $dw = $.fn.datewheel.capture;
        var options = $dw.data('datewheel');

        options.strip = $strip;

        options.minX =
        options.maxX =
        options.lastX = getPageX(event);

        options.minY =
        options.maxY =
        options.lastY = getPageY(event);

        options.firstTarget = event.target;
      }
     },
     mousemove : function (event) {
      var $dw = $.fn.datewheel.capture;

      if ($dw) {
        var options = $dw.data('datewheel');
        var $strip = options.strip;
        var dx = getPageX(event) - options.lastX;

        scrollStrip($strip, dx);

        $dw.trigger('datewheel.changing');

        options.lastX = getPageX(event);
        options.minX = Math.min(options.minX, options.lastX);
        options.maxX = Math.max(options.maxX, options.lastX);

        options.lastY = getPageY(event);
        options.minY = Math.min(options.minY, options.lastY);
        options.maxY = Math.max(options.maxY, options.lastY);

        options.lastTarget = event.target;
      }
     },
     mouseup : function (event) {
      var $dw = $.fn.datewheel.capture;
      if ($dw) {
        var options = $dw.data('datewheel');

        if (options.maxX - options.minX < 5 && options.maxY - options.minY < 5) {
          methods.click(event);

          return;
        }

        var $s = $(options.strip.children()[0]);
        var sl = parseInt(options.strip.css('left'));

        if (Math.abs(sl) > $s.outerWidth()/2) {
          rol(options.strip);
        }

        options.strip.css({left: 0});

        options.strip = null;
        $.fn.datewheel.capture = null;

        $dw.trigger('datewheel.changed');
      }
     },
     destroy : function( ) {

       return this.each(function(){

         var $this = $(this),
             data = $this.data('datewheel');

         // Namespacing FTW
         $(window).unbind('.datewheel');
         $this.removeData('datewheel');
       });

     },
     setdate : function () {}
  };

  $.fn.datewheel = function( method ) {
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.datewheel' );
    }
  };

})( jQuery );
