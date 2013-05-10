/**
 * Lissa Juice: Online audio visualization
 *
 * Copyright (c) 2013
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 */

lissa.controls = function() {
  var playing_id_ = false;

  function computeFreq(base, num, den, milli) {
    return base * (1.0 * num / den) * Math.pow(2, milli / 12000.0);
  }

  function getVal(classes) {
    return parseInt($(classes).val());
  }

  // TODO: So repetitive... Fix with IDs or something.
  $(function($) {

    $(".base_freq").knob({
      change :  function(base_freq) {
        lissa.synth.left.setFreq(computeFreq(base_freq,
                                            getVal('.left_osc.num'),
                                            getVal('.left_osc.den'),
                                            getVal('.left_osc.milli')));

        lissa.synth.right.setFreq(computeFreq(base_freq,
                                             getVal('.right_osc.num'),
                                             getVal('.right_osc.den'),
                                             getVal('.right_osc.milli')));
      },
    });

    $(".left_osc.num").knob({
      change :  function(num) {
        lissa.synth.left.setFreq(computeFreq(getVal('.base_freq'),
                                            num,
                                            getVal('.left_osc.den'),
                                            getVal('.left_osc.milli')));
      },
    });

    $(".left_osc.den").knob({
      change :  function(den) {
        lissa.synth.left.setFreq(computeFreq(getVal('.base_freq'),
                                            getVal('.left_osc.num'),
                                            den,
                                            getVal('.left_osc.milli')));
      },
    });

    $(".left_osc.milli").knob({
      change :  function(milli) {
        lissa.synth.left.setFreq(computeFreq(getVal('.base_freq'),
                                            getVal('.left_osc.num'),
                                            getVal('.left_osc.den'),
                                            milli));
      },
    });

    $(".left_osc.phase").knob({
      change :  function(value) {
        lissa.synth.left.setPhase(value / 360.0);
      },
    });

    $(".left_osc.sin").knob({
      change :  function(value) {
        lissa.synth.left.setAmp('sin', value / 100.0);
      },
    });

    $(".left_osc.tri").knob({
      change :  function(value) {
        lissa.synth.left.setAmp('tri', value / 100.0);
      },
    });

    $(".right_osc.num").knob({
      change :  function(num) {
        lissa.synth.right.setFreq(computeFreq(getVal('.base_freq'),
                                            num,
                                            getVal('.right_osc.den'),
                                            getVal('.right_osc.milli')));
      },
    });

    $(".right_osc.den").knob({
      change :  function(den) {
        lissa.synth.right.setFreq(computeFreq(getVal('.base_freq'),
                                            getVal('.right_osc.num'),
                                            den,
                                            getVal('.right_osc.milli')));
      },
    });

    $(".right_osc.milli").knob({
      change :  function(milli) {
        lissa.synth.right.setFreq(computeFreq(getVal('.base_freq'),
                                            getVal('.right_osc.num'),
                                            getVal('.right_osc.den'),
                                            milli));
      },
    });

    $(".right_osc.phase").knob({
      change :  function(value) {
        lissa.synth.right.setPhase(value / 360.0);
      },
    });

    $(".right_osc.sin").knob({
      change :  function(value) {
        lissa.synth.right.setAmp('sin', value / 100.0);
      },
    });

    $(".right_osc.tri").knob({
      change :  function(value) {
        lissa.synth.right.setAmp('tri', value / 100.0);
      },
    });
  });

  $(document).ready(function() {
    $('.minicolors').each(function() {
      $(this).minicolors({
        animationSpeed: 0,
        position: 'top',
        textfield: !$(this).hasClass('no-textfield'),
        change: function(hex, opacity) {
          var red = parseInt(hex.substring(1, 3), 16);
          var green = parseInt(hex.substring(3, 5), 16);
          var blue = parseInt(hex.substring(5, 7), 16);
          lissa.figure.setColor(red, green, blue);
        },
      });
    });
  });

  function randomize() {
    // Randomize the knobs within some limits, I think it'll sound nice.
    function random_int(low, high) {
      return Math.floor((high - low + 1) * Math.random()) + low;
    }

    var left_num = random_int(1, 5);
    var left_den = random_int(1, 5);
    var left_milli = random_int(-7, 7);
    var left_sin_amount = random_int(0, 100);
    var left_tri_amount = 100 - left_sin_amount;

    var right_num = random_int(1, 5);
    var right_den = random_int(1, 5);
    var right_milli = random_int(-7, 7);
    var right_sin_amount = random_int(0, 100);
    var right_tri_amount = 100 - right_sin_amount;

    $(".left_osc.num").val(left_num).trigger('change');
    $(".left_osc.den").val(left_den).trigger('change');
    $(".left_osc.milli").val(left_milli).trigger('change');
    $(".left_osc.sin").val(left_sin_amount).trigger('change');
    $(".left_osc.tri").val(left_tri_amount).trigger('change');

    $(".right_osc.num").val(right_num).trigger('change');
    $(".right_osc.den").val(right_den).trigger('change');
    $(".right_osc.milli").val(right_milli).trigger('change');
    $(".right_osc.sin").val(right_sin_amount).trigger('change');
    $(".right_osc.tri").val(right_tri_amount).trigger('change');

    lissa.synth.left.setFreq(
        computeFreq(getVal('.base_freq'), left_num, left_den, left_milli));
    lissa.synth.left.setAmp('sin', left_sin_amount / 100.0);
    lissa.synth.left.setAmp('tri', left_tri_amount / 100.0);

    lissa.synth.right.setFreq(
        computeFreq(getVal('.base_freq'), right_num, right_den, right_milli));
    lissa.synth.right.setAmp('sin', right_sin_amount / 100.0);
    lissa.synth.right.setAmp('tri', right_tri_amount / 100.0);

    var red = Math.floor(256 * Math.random());
    var green = Math.floor(256 * Math.random());
    var blue = Math.floor(256 * Math.random());
    lissa.figure.setColor(red, green, blue);

    var red_hex = '0' + red.toString(16);
    var green_hex = '0' + green.toString(16);
    var blue_hex = '0' + blue.toString(16);
    $('.minicolors').minicolors('value', '#' + red_hex.substring(red_hex.length - 2)
                                             + green_hex.substring(green_hex.length - 2)
                                             + blue_hex.substring(blue_hex.length - 2));
  }

  function maybeRandomize() {
    if (Math.random() < 0.2)
      randomize();
  }

  return {
    togglePlaying: function() {
      if (playing_id_) {
        $('.play').text('Play me a song!');
        clearInterval(playing_id_);
        playing_id_ = 0;
      }
      else {
        randomize();
        playing_id_ = setInterval(maybeRandomize, 300);
        $('.play').text('Stop the "song"');
      }
    },
    randomize: randomize,
  };
}();
