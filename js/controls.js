/**
 * Lissa Juice: Online audio visualization
 *
 * Copyright (c) 2013
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 */

lissa.templates = function() {
  function init($) {
    $('script[type="underscore/template"]').each(function(){
      var tmpl = null;
      var $this = $(this);
      var id = $(this).attr('id');
      try {
        tmpl = _.template($this.text());
      } catch (error) {
        console.log('Error compiling template', id, error);
      }
      this.templates[id] = function() {
        try {
          return tmpl.apply(this, arguments);
        } catch (error) {
          console.log('Error executing template', id, error);
        }
      };
    });
  }
  return {
    templates: {},
    init: init,
  };
}();

lissa.controls = {};

lissa.controls.knob = function($container, f, settings) {
  var $knob;

  function render() {
    $container.append(lissa.templates.templates.knob(settings));
    $knob = $container.find('#'+settings.id).first();
    $knob.knob({change: f});
  }

  function getVal() {
    return parseInt($knob.val());
  }

  function setVal(val) {
    $knob.val(val).trigger('change');
  }

  return {
    render: render,
    getVal: getVal,
    setVal: setVal,
  };
};

lissa.controls.knobGroup = function(knob_args, f) {

  var knobs = {};

  function on_change() {
    var vals = [];
    _.each(knobs, function(knob) {
      vals.append(knob.getVal());
    });
    return f(vals);
  }

  function render() {
    _.each(knob_args, function(args) {
      knobs[args.settings.id] = lissa.controls.knob(args.$container, on_change, args.settings);
    });
  }

  function getVal(id) {
    return knobs[id].getVal();
  }

  function setVal(id, val) {
    return knobs[id].setVal(val);
  }

  return {
    render: render,
    getVal: getVal,
    setVal: setVal,
  };
};

lissa.controls.oscillator = function($container, title, model, base_freq_knob) {
  // model is a lissa.oscillator()

  var freq_knob_group = null;
  var phase_knob = null;
  var sin_knob = null;
  var tri_knob = null;

  function render() {
    var $el = lissa.templates.templates.oscillator({});
    $container.append($el);

    var $col1 = $container.find('.knob-column.col-1').first();
    var $col2 = $container.find('.knob-column.col-2').first();
    var $col3 = $container.find('.knob-column.col-3').first();

    freq_knob_group = lissa.controls.knobGroup(
      [ {
          $container: $col1,
          settings: {
            label: 'MULTIPLY',
            min_val: 1,
            max_val: 12,
            default_val: 1,
          }
        }, {
          $container: $col1,
          settings: {
            label: 'DIVIDE',
            min_val: 1,
            max_val: 12,
            default_val: 1,
          }
        }, {
          $container: $col2,
          settings: {
            label: 'DETUNE',
            min_val: -100,
            max_val: 100,
            default_val: 0,
          }
      } ],
      function(num, den, milli) {
        model.setFreq(base_freq.knob.getVal() * (1.0 * num / den) * Math.pow(2, milli / 12000.0));
      }
    );

    phase_knob = lissa.controls.knob(
      $col2,
      model.setPhase,
      {
        label: 'PHASE',
        min_val: -180,
        max_val: 180,
        default_val: 0,
      }
    );

    sin_knob = lissa.controls.knob(
      $col3,
      function(val){
        return model.setAmp('sin', val);
      },
      {
        label: 'SIN',
        min_val: 0,
        max_val: 100,
        default_val: 70,
      }
    );

    tri_knob = lissa.controls.knob(
      $col3,
      function(val){
        return model.setAmp('tri', val);
      },
      {
        label: 'TRI',
        min_val: 0,
        max_val: 100,
        default_val: 70,
      }
    );
  }

  function updateFreq() {
    freq_knob_group.items[0].trigger('change');
  }

  return {
    updateFreq: updateFreq,
  };
};

lissa.controls.init = function($container) {
  var playing_id_ = false;

  var base_freq_knob = lissa.controls.knob(
    $container.find('#base_freq').first(),
    function(val) {
      left_oscillator_control.updateFreq();
      right_oscillator_control.updateFreq();
    },
    {
      label: 'BASE FREQUENCY',
      min_val: 1,
      max_val: 500,
      default_val: 200,
    }
  );

  var left_oscillator_control = lissa.controls.oscillator(
    $container.find('#left-oscillator').first(),
    'Left Oscillator - X',
    lissa.synth.left,
    base_freq_knob
  );

  var right_oscillator_control = lissa.controls.oscillator(
    $container.find('#right-oscillator').first(),
    'Right Oscillator - Y',
    lissa.synth.right,
    base_freq_knob
  );

};

/*
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
*/
