/**
 * Lissa Juice: Online audio visualization
 *
 * Copyright (c) 2013
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 */

var PI = 3.14159265359;
var SAMPLE_RATE = 44100.0;

function smooth_value(x, decay_rate_) {
  var target_ = x;
  var val_ = 0;
  function set(x) {
    target_ = x;
  }
  function get() {
    val_ = decay_rate_ * val_ + (1 - decay_rate_) * target_;
    return val_;
  }
  return {
    get: get,
    set: set,
  };
}

function waveform(type) {
  var SIN_RESOLUTION = 1024;
  var SIN_LOOKUP = [];
  for (var i = 0; i < SIN_RESOLUTION + 1; i++) {
    SIN_LOOKUP.push(Math.sin(2 * PI * i / SIN_RESOLUTION));
  }
  function sin(t) {
    // Linear interpolate sin lookup for speed (sshhh, no one will notice).
    var normal = t - Math.floor(t);
    var index = Math.floor(normal * SIN_RESOLUTION);
    var prog = normal * SIN_RESOLUTION - index;
    return (1 - prog) * SIN_LOOKUP[index] + prog * SIN_LOOKUP[index + 1];
  }

  function sqr(t) {
    var normal = t - Math.floor(t);
    if (normal < 0.5)
      return 1;
    return -1;
  }

  function saw(t) {
    return 2 * (t - Math.floor(t)) - 1;
  }

  function tri(t) {
    var normal = t - Math.floor(t);
    return 1 - 2 * Math.abs(1 - 2 * normal);
  }

  var types = {
    sine: sin,
    square: sqr,
    saw: saw,
    triangle: tri,
  };

  function get(t) {
    return types[type](t);
  }

  return {
    get: get,
  };
}

function oscillator() {
  var AMP_DECAY = 0.99995;
  var FREQ_DECAY = 0.997;
  var PHASE_DECAY = 0.9994;

  var current_phase_ = 0.0;
  var frequency_ = smooth_value(400.0, FREQ_DECAY);
  var phase_offset_ = smooth_value(0.0, PHASE_DECAY);
  var waves_ = {
    sin: waveform('sine'),
    saw: waveform('saw'),
    sqr: waveform('square'),
    tri: waveform('triangle'),
  };
  var amps_ = {};
  _.each(waves_, function(w, type) {
    amps_[type] = smooth_value(0.0, AMP_DECAY);
  });
  amps_.sin.set(0.7);

  function tick() {
    phase_offset = phase_offset_.get();
    frequency = frequency_.get();
    current_phase_ += frequency / SAMPLE_RATE;

    var val = 0.0;
    _.each(waves_, function(w, type) {
      val += amps_[type].get() * w.get(current_phase_ + phase_offset);
    });
    return val;
  }

  return {
    tick: tick,
    setFrequency: frequency_.set,
    setPhase: phase_offset_.set,
    setAmp: function(type, val) { amps_[type].set(val); },
  };
}


var lissa = {};

lissa.synth = function() {

  var DEFAULT_FREQ = 200.0;
  var left_osc_ = 'cat';
  var right_osc_ = 'dog';

  function init() {
    left_osc_ = oscillator();
    left_osc_.setFrequency(DEFAULT_FREQ);
    left_osc_.setPhase(0.0);

    right_osc_ = oscillator();
    right_osc_.setFrequency(DEFAULT_FREQ);
    right_osc_.setPhase(0.25);
  }

  function clip(s) {
    if (s >= 1)
      return 1;
    if (s <= -1)
      return -1;
    return s;
  }

  function process(buffer) {
    var output_left = buffer.outputBuffer.getChannelData(0);
    var output_right = buffer.outputBuffer.getChannelData(1);

    var size = output_left.length;
    for (var i = 0; i < size; ++i) {
      output_left[i] = clip(left_osc_.tick());
      output_right[i] = clip(right_osc_.tick());
    }
    lissa.figure.process(buffer);
  }

  return {
    process: process,
    left: function() { return left_osc_; },
    right: function() { return right_osc_; },
    init: init,
  };
}();

lissa.figure = function() {
  var BUFFER_MAX = 2048;
  var BORDER = 10;
  var COLOR_DECAY = 0.92;

  var figure_context_ = null;
  var canvas_ = null;
  var points = [];
  var red_ = smooth_value(255, COLOR_DECAY);
  var green_ = smooth_value(255, COLOR_DECAY);
  var blue_ = smooth_value(0, COLOR_DECAY);

  function init() {
    // Setup drawing context.
    canvas_ = document.getElementById('lissajous');
    figure_context_ = canvas_.getContext('2d');
  }

  function draw() {
    // Fadeout canvas a little bit.
    figure_context_.globalAlpha = 0.1;
    figure_context_.fillStyle = 'black';
    figure_context_.fillRect(0, 0, canvas_.width + 2 * BORDER, canvas_.height + 2 * BORDER);

    // Prepare to draw.
    figure_context_.globalAlpha = 1;
    red = Math.floor(red_.get());
    green = Math.floor(green_.get());
    blue = Math.floor(blue_.get());
    figure_context_.fillStyle = 'rgb(' + red + ',' + green + ',' + blue + ')';

    // Draw it for Mr. Lissajous.
    for (var i = 1; i < points.length; i += 1) {
      var x = canvas_.width / 2 + points[i][0] * (canvas_.width / 2 - BORDER);
      var y = canvas_.height / 2 - points[i][1] * (canvas_.height / 2 - BORDER);

      figure_context_.fillRect(x, y, 1, 1);
    }

    // Clear points we drew.
    points = [];

    // Request next run.
    window.requestAnimationFrame(draw);
  }

  function setColor(r, g, b) {
    red_.set(r);
    green_.set(g);
    blue_.set(b);
  }

  function process(buffer) {
    if (points.length > BUFFER_MAX) {
      return;
    }

    var output_left = buffer.outputBuffer.getChannelData(0);
    var output_right = buffer.outputBuffer.getChannelData(1);

    var size = output_left.length;
    for (var i = 0; i < size; ++i) {
      points.push([output_left[i], output_right[i]]);
    }
  }

  return {
    init: init,
    draw: draw,
    setColor: setColor,
    process: process,
  };
}();

lissa.init = function() {
  var context = new webkitAudioContext();
  lissa.figure.init();
  lissa.synth.init();

  var synth_source = context.createScriptProcessor(512, 0, 2);
  synth_source.onaudioprocess = lissa.synth.process;

  synth_source.connect(context.destination);
  lissa.figure.draw();
}

window.onload = lissa.init;
