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

var lissa = {};
lissa.constants = {};

lissa.constants.SAMPLE_RATE = 44100.0;

lissa.smoothValue = function(x, decay_rate) {
  var DEFAULT_DECAY = 0.99;

  var decay_rate_ = decay_rate || DEFAULT_DECAY;
  var target_ = x;
  var val_ = 0;

  function set(x) {
    target_ = x;
  }

  function tick() {
    val_ = decay_rate_ * val_ + (1 - decay_rate_) * target_;
    return val_;
  }

  function get() {
    return target_;
  }

  return {
    tick: tick,
    set: set,
    get: get,
  };
}

lissa.waveforms = function() {
  var SIN_RESOLUTION = 1024;
  var SIN_LOOKUP = [];
  for (var i = 0; i < SIN_RESOLUTION + 1; i++) {
    SIN_LOOKUP.push(Math.sin(2 * Math.PI * i / SIN_RESOLUTION));
  }

  function saw(t) {
    return 2 * (t - Math.floor(t)) - 1;
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

  function tri(t) {
    // This is phased offset by 90 degrees.
    var normal = t - Math.floor(t);
    return 1 - 2 * Math.abs(1 - 2 * normal);
  }

  return {
    saw: saw,
    sin: sin,
    sqr: sqr,
    tri: tri,
  };
}();

lissa.oscillator = function() {
  var AMP_DECAY = 0.99995;
  var FREQ_DECAY = 0.997;
  var PHASE_DECAY = 0.9994;

  var amps_ = {};
  var current_phase_ = 0.0;
  var frequency_ = lissa.smoothValue(0.0, FREQ_DECAY);
  var phase_offset_ = lissa.smoothValue(0.0, PHASE_DECAY);

  function tick() {
    phase_offset = phase_offset_.tick();
    frequency = frequency_.tick();
    current_phase_ += frequency / lissa.constants.SAMPLE_RATE;

    var val = 0.0;
    _.each(amps_, function(amp, type) {
      val += amp.tick() * lissa.waveforms[type](current_phase_ + phase_offset);
    });
    return val;
  }

  function setAmp(type, val) {
    if (amps_[type])
      amps_[type].set(val);
    else
      amps_[type] = lissa.smoothValue(val, AMP_DECAY);
  }

  function getAmp(type) {
    if (amps_[type]) {
      console.log('type', type, 'is known', amps_[type]);
      return amps_[type].get();
    }
    else {
      console.log('type', type, 'is unknown');
      return 0;
    }
  }

  return {
    tick: tick,
    setFreq: frequency_.set,
    setPhase: phase_offset_.set,
    setAmp: setAmp,
    getFreq: frequency_.get,
    getPhase: phase_offset_.get,
    getAmp: getAmp,
  };
}


lissa.synth = function() {
  var DEFAULT_FREQ = 200.0;

  function init() {
    this.left = lissa.oscillator();
    this.left.setAmp('sin', 0.7);
    this.left.setFreq(DEFAULT_FREQ);
    this.left.setPhase(0.0);

    this.right = lissa.oscillator();
    this.right.setAmp('sin', 0.7);
    this.right.setFreq(DEFAULT_FREQ);
    this.right.setPhase(0.25);
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
      output_left[i] = clip(this.left.tick());
      output_right[i] = clip(this.right.tick());
    }
  }

  return {
    init: init,
    process: process,
    left: null,
    right: null,
  };
}();

lissa.figure = function() {
  var BUFFER_MAX = 4096;
  var BORDER = 10;
  var COLOR_DECAY = 0.92;

  var figure_context_ = null;
  var canvas_ = null;
  var points = [];
  var red_ = lissa.smoothValue(255, COLOR_DECAY);
  var green_ = lissa.smoothValue(255, COLOR_DECAY);
  var blue_ = lissa.smoothValue(0, COLOR_DECAY);

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
    red = Math.floor(red_.tick());
    green = Math.floor(green_.tick());
    blue = Math.floor(blue_.tick());
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

  function process(left, right) {
    if (points.length > BUFFER_MAX) {
      return;
    }

    var size = left.length;
    for (var i = 0; i < size; ++i) {
      points.push([left[i], right[i]]);
    }
  }

  return {
    init: init,
    draw: draw,
    setColor: setColor,
    process: process,
  };
}();

lissa.process = function(buffer) {
  if (lissa.active) {
    lissa.synth.process(buffer);
    lissa.figure.process(buffer.outputBuffer.getChannelData(0),
                         buffer.outputBuffer.getChannelData(1));
  }
  else {
    var output_left = buffer.outputBuffer.getChannelData(0);
    var output_right = buffer.outputBuffer.getChannelData(1);

    var size = output_left.length;
    for (var i = 0; i < size; ++i) {
      output_left[i] = 0.0;
      output_right[i] = 0.0;
    }
  }
}
