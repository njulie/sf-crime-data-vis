// get the svg map
var svgContainer = d3.select("svg");


// Morning: pastel purple
// Afternoon/Evening: purple
// Night: dark purple/black
var color = d3.scale.ordinal().range(["#ddd1e7", "#663096", "#190729"]);


// load the data
d3.json("scpd-incidents.json", function(error, crimes) {
	if (error) throw error;

	update(crimes.data);
	setUpControls(crimes.data);
});


// This function repositions the city pins when dragged
function mover(d) {
	var dragged = d3.select(this);
	var radius = parseInt(dragged.attr("width")) / 2;
	var svgWidth = parseInt(svgContainer.attr("width")),
		svgHeight = parseInt(svgContainer.attr("height"));

	dragged
    	.attr("x", Math.max(radius, Math.min(svgWidth - radius, d3.event.x) - radius))
    	.attr("y", Math.max(radius, Math.min(svgHeight - radius, d3.event.y) - radius));

    	// ^^ may have to examine d3.mouse(container) for chrome..? perhaps. Idk yet
};

// This function draws the city pins and makes them draggable!
function drawCityPins() {

	var drag = d3.behavior.drag()

		.on("drag", mover);

	// City A push pin
	svgContainer.append("image")
		.attr("x", 200)
  		.attr("y", 375)
  		.attr("height", 60)
  		.attr("width", 60)
  		.attr("xlink:href", "citymarker.png")
  		.attr("class", "cityPins")
  		.attr("id", "cityA")
		.style("opacity", "0.87")
		.call(drag);

	// City B push pin
	svgContainer.append("image")
		.attr("x", 450)
  		.attr("y", 375)
  		.attr("height", 60)
  		.attr("width", 60)
		.attr("xlink:href", "citymarker.png")
		.attr("class", "cityPins")
		.attr("id", "cityB")
		.style("opacity", "0.87")
		.call(drag);

};


function removeCityPins(d) {
	if (svgContainer.selectAll(".cityPins"))
		svgContainer.selectAll(".cityPins").remove();
};




// Initial Visualization of the Crime Data
function update(crimes) {

	// Select all data points
	var circles = svgContainer.selectAll("circle")
						.data(crimes)
						.attr("class", "update");

	circles.enter().append("circle").attr("class","enter")
		.attr("cx", function (d) { return projection(d.Location)[0]; })
		.attr("cy", function (d) { return projection(d.Location)[1]; })
		.attr("r", 2)

		// Set Color Attributes
		.style("fill", function(d) {
			//Get hour
			var hour = parseInt(d.Time.split(":")[0]);
			if(hour > 4 && hour <= 12) {
				return color("morning");
			} else if (hour > 12 && hour <= 20) {
				return color("afternoon");
			} else {
				return color("evening");
			}
		});
	

	circles.exit().remove();

	removeCityPins(); // so that images doesn't keep redrawing city pins over each other
	drawCityPins(); // redraw the city pins
};



function setUpControls(crimes) {

	// Shallow Copy of Data to display
	var curr_crimes = crimes;

	// Handle Weekday Checkbox Settings
	$(".weekdayCheckbox").on("click", function(){
		var day = this.value;
		if (this.checked) {
			var temp_vals = crimes.filter(function(value) {
				return value.DayOfWeek === day;
			});
			curr_crimes = curr_crimes.concat(temp_vals);
		} else {
			curr_crimes = curr_crimes.filter(function(value) {
				return value.DayOfWeek !== day;
			});
		}
		update(curr_crimes);
	});	

};
