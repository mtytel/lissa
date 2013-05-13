lissa.init = function($) {
  if(!('webkitAudioContext' in window)) {
    alert("This uses the Web Audio API, try opening it in Google Chrome.");
    return;
  }

  lissa.templates.init();
  var context = new webkitAudioContext();
  lissa.figure.init();
  lissa.synth.init();

  var synth_processor = context.createScriptProcessor(1024, 0, 2);
  synth_processor.onaudioprocess = lissa.process;

  synth_processor.connect(context.destination);
  lissa.figure.draw();

  lissa.controls.init($('.controls'));

  $(window).focus(function() { lissa.active = true; });
  $(window).blur(function() { lissa.active = false; });

  lissa.active = false;
  if (document.hasFocus)
    window.focus();
};

(function($){
  $(document).ready(function(){
    lissa.init($);
  });
})(jQuery);
