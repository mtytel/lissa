/**
 * Lissa Juice: Online audio visualization
 *
 * Matt Tytel and Noura Howell
 *
 * Copyright (c) 2013
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 */

lissa.controls = {};

lissa.controls.knob = function($container, f, settings) {
  var $knob = null;

  function render() {
    // TODO should empty and re-fill the container
    // because render can be called more than once
    // to do this, make each knob have a container just for itself
    // so that the order of making knobs doesn't matter
    $container.append(lissa.templates.templates.knob(settings));
    $knob = $container.find('#'+settings.id).first();
    $knob.knob({change: f});
    $knob.on('change', function(ev) {
      f($knob.val());
    });
  }

  function getVal() {
    return parseInt($knob.val());
  }

  function setVal(val) {
    $knob.val(val).trigger('change');
    f(val);
  }

  return {
    render: render,
    getVal: getVal,
    setVal: setVal,
  };
};

lissa.controls.oscillator = function($container, title, model, base_freq_knob) {
  // model is a lissa.oscillator()

  var id_prefix = $container.attr('id');

  var freq_num_knob = null;
  var freq_den_knob = null;
  var freq_milli_knob = null;
  var phase_knob = null;
  var sin_knob = null;
  var tri_knob = null;

  var freq_num_knob_settings = {
    label: 'MULTIPLY',
    min_val: 1,
    max_val: 12,
    default_val: 1,
    id: get_id('num-knob'),
  };
  var freq_den_knob_settings = {
    label: 'DIVIDE',
    min_val: 1,
    max_val: 12,
    default_val: 1,
    id: get_id('den-knob'),
  };
  var freq_milli_knob_settings = {
    label: 'DETUNE',
    min_val: -100,
    max_val: 100,
    default_val: 0,
    id: get_id('milli-knob'),
  };
  var phase_knob_settings = {
    label: 'PHASE',
    min_val: -180,
    max_val: 180,
    default_val: model.getPhase() * 360,
    id: get_id('phase-knob'),
  };

  var sin_knob_settings = {
    label: 'SIN',
    min_val: 0,
    max_val: 100,
    default_val: model.getAmp('sin') * 100,
    id: get_id('sin-knob'),
  };
  var tri_knob_settings = {
    label: 'TRI',
    min_val: 0,
    max_val: 100,
    default_val: model.getAmp('tri') * 100,
    id: get_id('tri-knob'),
  };

  function setFreq() {
    // setTimeout makes sure all knobs have updated before reading their value
    setTimeout(function() {
      var freq = base_freq_knob.getVal() * (1.0 * freq_num_knob.getVal() / freq_den_knob.getVal()) * Math.pow(2, freq_milli_knob.getVal() / 12000.0);
      model.setFreq(freq);
    }, 0);
  }

  // $container.attr('id') is used to prefix the ids of the knobs
  function get_id(s) {
    return id_prefix + '-' + s;
  }

  function render() {
    var $el = lissa.templates.templates.oscillator({title: title});
    $container.append($el);

    var $col1 = $container.find('.knob-column.col-1').first();
    var $col2 = $container.find('.knob-column.col-2').first();
    var $col3 = $container.find('.knob-column.col-3').first();

    freq_num_knob = lissa.controls.knob($col1, setFreq, freq_num_knob_settings);
    freq_num_knob.render();

    freq_den_knob = lissa.controls.knob($col1, setFreq, freq_den_knob_settings);
    freq_den_knob.render();

    freq_milli_knob = lissa.controls.knob($col2, setFreq, freq_milli_knob_settings);
    freq_milli_knob.render();

    phase_knob = lissa.controls.knob($col2,
      function(val) {
        model.setPhase(val / 360);
      }, 
      phase_knob_settings);
    phase_knob.render();

    function wave_amp_setter(type, max) {
      return function(val) {
        model.setAmp(type, val / max);
      };
    }

    sin_knob = lissa.controls.knob($col3,
        wave_amp_setter('sin', sin_knob_settings.max_val), sin_knob_settings);
    sin_knob.render();

    tri_knob = lissa.controls.knob($col3,
        wave_amp_setter('tri', tri_knob_settings.max_val), tri_knob_settings);
    tri_knob.render();
  }

  function randomize() {
    freq_num_knob.setVal(lissa.utils.random_int(1,5));
    freq_den_knob.setVal(lissa.utils.random_int(1,5));
    freq_milli_knob.setVal(lissa.utils.random_int(-7,7));
    var sin_amount = lissa.utils.random_int(0,100);
    sin_knob.setVal(sin_amount);
    if (lissa.harmonograph_type === 'lateral')
      tri_knob.setVal(100 - sin_amount);
    else
      tri_knob.setVal(0);
  }

  return {
    render: render,
    randomize: randomize,
    setFreq: setFreq,
  };
};

lissa.controls.minicolors = function($container) {
  function init() {
    $container.each(function() {
      $(this).minicolors({
        animationSpeed: 0,
        textfield: !$(this).hasClass('no-textfield'),
        change: function(hex, opacity) {
          var red = parseInt(hex.substring(1, 3), 16);
          var green = parseInt(hex.substring(3, 5), 16);
          var blue = parseInt(hex.substring(5, 7), 16);
          lissa.figure.setColor(red, green, blue);
        },
      });
    });
  }

  function randomize() {
    var red = Math.floor(256 * Math.random());
    var green = Math.floor(256 * Math.random());
    var blue = Math.floor(256 * Math.random());
    lissa.figure.setColor(red, green, blue);

    var red_hex = '0' + red.toString(16);
    var green_hex = '0' + green.toString(16);
    var blue_hex = '0' + blue.toString(16);
    $container.minicolors('value', '#' + red_hex.substring(red_hex.length - 2)
                                + green_hex.substring(green_hex.length - 2)
                                + blue_hex.substring(blue_hex.length - 2));
  }

  return {
    init: init,
    randomize: randomize,
  };
};

lissa.controls.randomizer = function($container, items) {
  var $randomize_button = $container.find('.randomize').first();
  var $play_button = $container.find('.play').first();
  var $controls_button = $container.find('.controls-toggle').first();
  var controls_shown = false;
  var playing_id = 0;

  if (!controls_shown)
    $('.knobs').hide();

  function init() {
    $randomize_button.on('click', randomize);
    $play_button.on('click', togglePlaying);
    $controls_button.on('click', toggleControls);
  }

  function randomize() {
    _.each(items, function(item) {
      item.randomize();
    });
  }

  function maybeRandomize() {
    if (Math.random() < 0.2) {
      randomize();
    }
  }

  function toggleControls() {
    controls_shown = !controls_shown;
    if (controls_shown) {
      $('.knobs').fadeTo(500, 0.75);
      $controls_button.text('Hide');
    }
    else {
      $('.knobs').fadeOut(500);
      $controls_button.text('Controls');
    }
  }

  function togglePlaying() {
    if (playing_id) {
      $play_button.text('Play Song!');
      clearInterval(playing_id);
      playing_id = 0;
    }
    else {
      randomize();
      playing_id = setInterval(maybeRandomize, 300);
      $play_button.text('Stop Song.');
    }
  }

  return {
    init: init,
  };
};

lissa.controls.harmonograph_type = function($container, model) {
  var $buttons = $container.find('.harmonograph-type .simple-button');

  model.harmonograph_type = null;

  function init() {
    $buttons.on('click', function(ev) {
      var $this = $(this);
      choose($this);
    });
    choose($($buttons[0]));
  }

  function choose($this) {
    model.harmonograph_type = $this.data('type');
    $buttons.removeClass('pressed');
    $this.addClass('pressed');
  }

  function randomize() {
    var x = Math.random();
    var i = 0;
    if (x < 0.5) {
      i = 0;
    } else if (x < 0.75) {
      i = 1;
    } else {
      i = 2;
    }
    choose($($buttons[i]));
  }

  return {
    init: init,
    randomize: randomize,
  };
};

lissa.controls.init = function($container) {
  var base_freq_knob_settings = {
    label: 'BASE FREQUENCY',
    min_val: 1,
    max_val: 500,
    default_val: 200,
    id: 'base-freq-knob'
  };
  var base_freq_knob = lissa.controls.knob(
    $container.find('#base_freq').first(),
    function(val) {
      left_oscillator_control.setFreq();
      right_oscillator_control.setFreq();
    },
    base_freq_knob_settings
  );
  base_freq_knob.render();

  var left_oscillator_control = lissa.controls.oscillator(
    $container.find('#left-oscillator').first(),
    'Left Oscillator - X',
    lissa.synth.left,
    base_freq_knob
  );
  left_oscillator_control.render();

  var right_oscillator_control = lissa.controls.oscillator(
    $container.find('#right-oscillator').first(),
    'Right Oscillator - Y',
    lissa.synth.right,
    base_freq_knob
  );
  right_oscillator_control.render();

  //TODO make minicolors scoped within the container somehow
  //or take its location as an input
  var minicolors = lissa.controls.minicolors($('.minicolors'));
  minicolors.init();

  var harmonograph_type = lissa.controls.harmonograph_type($container, lissa);
  harmonograph_type.init();

  var randomizer = lissa.controls.randomizer($container, [harmonograph_type, right_oscillator_control, left_oscillator_control, minicolors]);
  randomizer.init();
};

lissa.templates = function() {
  // http://underscorejs.org/#template
  // The skinny: Templates are super helpful for dynamically creating HTML
  // that gets used multiple times, but with a few parameters changed.
  // Underscore templates are sweet because you can pass in an arbitrary
  // JavaScript object and execute JavaScript code inside the template.
  function init() {
    // a wrapper around _.template to give error messages
    var that = this;
    $('script[type="underscore/template"]').each(function() {
      var template = null;
      var $this = $(this);
      var id = $(this).attr('id');

      try {
        template = _.template($this.text());
      }
      catch (error) {
        console.log('Error compiling template', id, error);
      }

      that.templates[id] = function() {
        try {
          return template.apply(this, arguments);
        }
        catch (error) {
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

