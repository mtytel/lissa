/**
 * Lissa Juice: Online audio visualization
 *
 * Copyright (c) 2013
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 */

lissa.BUFFER_SIZE = 1024;

lissa.init = function($) {
  if(!('webkitAudioContext' in window)) {
    alert("This uses the Web Audio API. Try opening it in Google Chrome.");
    return;
  }

  lissa.templates.init();
  var context = new webkitAudioContext();
  lissa.figure.init();
  lissa.synth.init(lissa.BUFFER_SIZE);

  var synth_processor = context.createScriptProcessor(lissa.BUFFER_SIZE, 0, 2);
  synth_processor.onaudioprocess = lissa.process;

  synth_processor.connect(context.destination);
  lissa.figure.draw();

  lissa.controls.init($('.controls'));

  $(window).focus(function() { lissa.active = true; });
  $(window).blur(function() { lissa.active = false; });

  lissa.active = document.hasFocus;
  if (lissa.active)
    window.focus();
};

(function($){
  $(document).ready(function(){
    lissa.init($);
  });
})(jQuery);
