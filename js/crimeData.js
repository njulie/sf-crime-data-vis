// get the svg map
var svgContainer = d3.select("svg");


// Morning: pastel purple
// Afternoon/Evening: purple
// Night: dark purple/black
var color = d3.scale.ordinal().range(["#ddd1e7", "#663096", "#190729"]);


// load the data
d3.json("scpd-incidents.json", function(error, crimes) {
	if (error) throw error;

	selectCities();
	update(crimes.data);
	setUpControls(crimes.data);

});


// Display two pins for city A and city B with default radii of 30 miles
//mp_ratio = 67; // mile-to-pixel ratio roughly x pixels per 1 mile --> could check this!!!

//default_radius_miles = 10;

function selectCities() {

	// City A push pin
	svgContainer.append("image")
		.attr("x", 200)
  		.attr("y", 375)
  		.attr("height", 60)
  		.attr("width", 60)
  		.attr("xlink:href", "citymarker.png")
  		.attr("class", "cityPins")
		.style("opacity", "0.87");

	// City B push pin
	svgContainer.append("image")
		.attr("x", 450)
  		.attr("y", 375)
  		.attr("height", 60)
  		.attr("width", 60)
		.attr("xlink:href", "citymarker.png")
		.attr("class", "cityPins")
		.style("opacity", "0.87");
};


function removeCityPins() {
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
	selectCities();
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
