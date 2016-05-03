/* Initialize sliders */

var sliderA = $("#sliderA"),
	sliderB = $("#sliderB");

sliderA.slider();
sliderA.on("slide", function(slideEvt) {
	$("#sliderAVal").text(slideEvt.value);
});

sliderB.slider();
sliderB.on("slide", function(slideEvt) {
	$("#sliderBVal").text(slideEvt.value);
});