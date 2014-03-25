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

lissa.harmonograph_type = null; // 'rotary' or 'lateral'

lissa.constants = {};

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
  var AMP_DECAY = 0.99997;
  var FREQ_DECAY = 0.997;
  var PHASE_DECAY = 0.9997;

  var sample_rate = 44100.0;
  var amps_ = {};
  var current_phase_ = 0.0;
  var frequency_ = lissa.smoothValue(0.0, FREQ_DECAY);
  var phase_offset_ = lissa.smoothValue(0.0, PHASE_DECAY);

  function tick() {
    phase_offset = phase_offset_.tick();
    frequency = frequency_.tick();
    current_phase_ += frequency / sample_rate;
    if (current_phase_ > 1.0)
      current_phase_ -= 1.0;

    var val1 = 0.0;
    var val2 = 0.0;
    _.each(amps_, function(amp, type) {
      val1 += amp.tick() * lissa.waveforms[type](current_phase_ + phase_offset);
      val2 += amp.tick() *
              lissa.waveforms[type](current_phase_ + phase_offset + 0.25);
    });

    return [val1, val2];
  }

  function setAmp(type, val) {
    if (amps_[type])
      amps_[type].set(val);
    else
      amps_[type] = lissa.smoothValue(val, AMP_DECAY);
  }

  function setSampleRate(rate) {
    sample_rate = rate;
  }

  function getAmp(type) {
    if (amps_[type]) {
      return amps_[type].get();
    }
    else {
      return 0;
    }
  }

  return {
    tick: tick,
    setFreq: frequency_.set,
    setPhase: phase_offset_.set,
    setAmp: setAmp,
    setSampleRate: setSampleRate,
    getFreq: frequency_.get,
    getPhase: phase_offset_.get,
    getAmp: getAmp,
  };
}


lissa.synth = function() {
  var DEFAULT_FREQ = 200.0;

  function init(buffer_size) {
    this.left = lissa.oscillator();
    this.left.setAmp('sin', 0.7);
    this.left.setFreq(DEFAULT_FREQ);
    this.left.setPhase(0.0);

    this.right = lissa.oscillator();
    this.right.setAmp('sin', 0.7);
    this.right.setFreq(DEFAULT_FREQ);
    this.right.setPhase(0.25);

    this.buffer_size = buffer_size;
    this.output = [];
    for (var i = 0; i < buffer_size; ++i)
      this.output.push([[0.0, 0.0], [0.0, 0.0]]);
  }

  function clip(s) {
    if (s >= 1)
      return 1;
    if (s <= -1)
      return -1;
    return s;
  }

  function setSampleRate(sample_rate) {
    this.left.setSampleRate(sample_rate);
    this.right.setSampleRate(sample_rate);
  }

  function process() {
    for (var i = 0; i < this.buffer_size; ++i) {
      this.output[i][0] = this.left.tick();
      this.output[i][1] = this.right.tick();
    }
  }

  return {
    init: init,
    process: process,
    setSampleRate: setSampleRate,
    buffer_size: 0,
    left: null,
    right: null,
    output: null,
  };
}();

lissa.figure = function() {
  var BUFFER_MAX = 4096;
  var BORDER = 10;
  var COLOR_DECAY = 0.92;

  var figure_context_ = null;
  var canvas_width_ = 0;
  var canvas_height_ = 0;
  var points = [];
  var red_ = lissa.smoothValue(255, COLOR_DECAY);
  var green_ = lissa.smoothValue(255, COLOR_DECAY);
  var blue_ = lissa.smoothValue(0, COLOR_DECAY);

  function init() {
    // Setup drawing context.
    var canvas = document.getElementById('lissajous');
    canvas_width_ = canvas.width = $(document).width();
    canvas_height_ = canvas.height = $(document).height();
    figure_context_ = canvas.getContext('2d');
  }

  function draw() {
    window.requestAnimationFrame(draw);
    if (points.length === 0)
      return;

    // Fadeout canvas a little bit.
    figure_context_.globalAlpha = 0.1;
    figure_context_.fillStyle = 'black';
    figure_context_.fillRect(0, 0, canvas_width_ + 2 * BORDER, canvas_height_ + 2 * BORDER);
    var drawing_width = Math.min(canvas_width_, canvas_height_);

    // Prepare to draw.
    figure_context_.globalAlpha = 1;
    red = Math.floor(red_.tick());
    green = Math.floor(green_.tick());
    blue = Math.floor(blue_.tick());
    figure_context_.fillStyle = 'rgb(' + red + ',' + green + ',' + blue + ')';

    // Draw it for Mr. Lissajous.
    if (lissa.harmonograph_type === 'lateral') {
      for (var i = 1; i < points.length; i++) {
        var x = canvas_width_ / 2 + points[i][0][0] * (drawing_width / 2 - BORDER);
        var y = canvas_height_ / 2 - points[i][1][0] * (drawing_width / 2 - BORDER);
        figure_context_.fillRect(x, y, 1, 5);
      }
    } else { // 'rotary' or 'rotaryinv'
      var sign = lissa.harmonograph_type === 'rotary' ? 1 : -1;
      for (var i = 1; i < points.length; i++) {
        var osc_x = (points[i][0][0] + points[i][1][0]) * 0.5;
        var osc_y = (points[i][0][1] + sign * points[i][1][1]) * 0.5;
        var x = canvas_width_ / 2 + osc_x * (drawing_width / 2 - BORDER);
        var y = canvas_height_ / 2 - osc_y * (drawing_width / 2 - BORDER);
        figure_context_.fillRect(x, y, 1, 5);
      }
    }

    // Clear points we drew.
    points = [];
  }

  function setColor(r, g, b) {
    red_.set(r);
    green_.set(g);
    blue_.set(b);
  }

  function process(osc_buffers) {
    if (points.length > BUFFER_MAX) {
      return;
    }

    points.push.apply(points, osc_buffers);
  }

  return {
    init: init,
    draw: draw,
    setColor: setColor,
    process: process,
  };
}();

lissa.process = function(buffer) {
  var output_left = buffer.outputBuffer.getChannelData(0);
  var output_right = buffer.outputBuffer.getChannelData(1);
  var size = output_left.length;

  if (lissa.active) {
    lissa.synth.setSampleRate(buffer.outputBuffer.sampleRate);
    lissa.synth.process();
    lissa.figure.process(lissa.synth.output);

    for (var i = 0; i < size; ++i) {
      output_left[i] = lissa.synth.output[i][0][0];
      output_right[i] = lissa.synth.output[i][1][0];
    }
  }
  else {
    for (var i = 0; i < size; ++i) {
      output_left[i] = 0.0;
      output_right[i] = 0.0;
    }
  }
}
