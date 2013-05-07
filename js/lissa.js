/**
 * Lissa Juice: Online audio visualization
 *
 * Copyright (c) 2013
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 */

var lissa = {};

lissa.synth = function() {

  var DEFAULT_FREQ = 200.0;
  var SAMPLE_RATE = 44100.0;
  var PI = 3.14159265359;

  var SIN_RESOLUTION = 1024;
  var SIN_LOOKUP = [];
  for (var i = 0; i < SIN_RESOLUTION + 1; i++) {
    SIN_LOOKUP.push(Math.sin(2 * PI * i / SIN_RESOLUTION));
  }

  var left_osc_ = null;
  var right_osc_ = null;

  function oscillator() {
    var AMP_DECAY = 0.99995;
    var FREQ_DECAY = 0.997;
    var PHASE_DECAY = 0.9994;

    var current_phase_ = 0.0;
    var frequency_ = 0.0, frequency_target_ = 400.0;
    var phase_offset_ = 0.0, phase_target_ = 0.0;
    var sin_amp_ = 0.0, sin_target_ = 0.7;
    var saw_amp_ = 0.0, saw_target_ = 0.0;
    var sqr_amp_ = 0.0, sqr_target_ = 0.0;
    var tri_amp_ = 0.0, tri_target_ = 0.0;

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

    function setFrequency(freq) {
      frequency_target_ = freq;
    }

    function setPhase(phase) {
      phase_target_ = phase;
    }

    function setSawAmp(amp) {
      saw_target_ = amp;
    }

    function setSinAmp(amp) {
      sin_target_ = amp;
    }

    function setSqrAmp(amp) {
      sqr_target_ = amp;
    }

    function setTriAmp(amp) {
      tri_target_ = amp;
    }

    function tick() {
      // Smooth values.
      phase_offset_ = PHASE_DECAY * phase_offset_ + (1 - PHASE_DECAY) * phase_target_;
      sin_amp_ = AMP_DECAY * sin_amp_ + (1 - AMP_DECAY) * sin_target_;
      saw_amp_ = AMP_DECAY * saw_amp_ + (1 - AMP_DECAY) * saw_target_;
      sqr_amp_ = AMP_DECAY * sqr_amp_ + (1 - AMP_DECAY) * sqr_target_;
      tri_amp_ = AMP_DECAY * tri_amp_ + (1 - AMP_DECAY) * tri_target_;
      frequency_ = FREQ_DECAY * frequency_ + (1 - FREQ_DECAY) * frequency_target_;

      // Update phase.
      current_phase_ += frequency_ / SAMPLE_RATE;

      var val = 0.0;
      val += sin_amp_ * sin(current_phase_ + phase_offset_);
      val += saw_amp_ * saw(current_phase_ + phase_offset_);
      val += sqr_amp_ * sqr(current_phase_ + phase_offset_);
      val += tri_amp_ * tri(current_phase_ + phase_offset_);
      return val;
    }

    return {
      tick: tick,
      setFrequency: setFrequency,
      setPhase: setPhase,
      setSawAmp: setSawAmp,
      setSinAmp: setSinAmp,
      setSqrAmp: setSqrAmp,
      setTriAmp: setTriAmp,
    };
  }

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

  function setLeftFreq(freq) {
    left_osc_.setFrequency(freq);
  }

  function setLeftPhase(phase) {
    left_osc_.setPhase(phase);
  }

  function setRightFreq(freq) {
    right_osc_.setFrequency(freq);
  }

  function setRightPhase(phase) {
    right_osc_.setPhase(phase);
  }

  function setLeftSinAmp(amp) {
    left_osc_.setSinAmp(amp);
  }

  function setLeftTriAmp(amp) {
    left_osc_.setTriAmp(amp);
  }

  function setRightSinAmp(amp) {
    right_osc_.setSinAmp(amp);
  }

  function setRightTriAmp(amp) {
    right_osc_.setTriAmp(amp);
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
    init: init,
    process: process,
    setLeftFreq: setLeftFreq,
    setLeftPhase: setLeftPhase,
    setLeftSinAmp: setLeftSinAmp,
    setLeftTriAmp: setLeftTriAmp,
    setRightFreq: setRightFreq,
    setRightPhase: setRightPhase,
    setRightSinAmp: setRightSinAmp,
    setRightTriAmp: setRightTriAmp,
  };
}();

lissa.figure = function() {
  var BUFFER_MAX = 2048;
  var BORDER = 10;
  var WIDTH = 600;
  var COLOR_DECAY = 0.92;

  var figure_context_ = null;
  var points = [];
  var red_ = 0, red_target_ = 255;
  var green_ = 0, green_target_ = 255;
  var blue_ = 0, blue_target_ = 0;

  function init() {
    // Setup drawing context.
    var canvas = document.getElementById('lissajous');
    figure_context_ = canvas.getContext('2d');
  }

  function draw() {
    // Fadeout canvas a little bit.
    figure_context_.globalAlpha = 0.1;
    figure_context_.fillStyle = 'black';
    figure_context_.fillRect(0, 0, WIDTH + 2 * BORDER, WIDTH + 2 * BORDER);

    // Prepare to draw.
    figure_context_.globalAlpha = 1;
    red_ = COLOR_DECAY * red_ + (1 - COLOR_DECAY) * red_target_;
    green_ = COLOR_DECAY * green_ + (1 - COLOR_DECAY) * green_target_;
    blue_ = COLOR_DECAY * blue_ + (1 - COLOR_DECAY) * blue_target_;
    figure_context_.fillStyle = 'rgb(' + Math.floor(red_) + ',' + Math.floor(green_) + ',' + Math.floor(blue_) + ')';

    // Draw it for Mr. Lissajous.
    for (var i = 1; i < points.length; i += 1) {
      var x = BORDER + WIDTH / 2 + points[i][0] * WIDTH / 2;
      var y = BORDER + WIDTH / 2 - points[i][1] * WIDTH / 2;

      figure_context_.fillRect(x, y, 1, 1);
    }

    // Clear points we drew.
    points = [];

    // Request next run.
    window.requestAnimationFrame(draw);
  }

  function setColor(red, green, blue) {
    red_target_ = red;
    green_target_ = green;
    blue_target_ = blue;
  }

  function process(buffer) {
    if (points.length > BUFFER_MAX) {
      console.log('poop');
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
