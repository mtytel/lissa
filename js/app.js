$(document).ready(function() {
  var context = new webkitAudioContext();
  lissa.figure.init();
  lissa.synth.init();

  var synth_source = context.createScriptProcessor(512, 0, 2);
  synth_source.onaudioprocess = lissa.process;

  synth_source.connect(context.destination);
  lissa.figure.draw();
  
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
