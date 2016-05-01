
// load the data
d3.json("scpd-incidents.json", function(error, crimes) {
	if (error) throw error;

	update(crimes.data);
	setUpControls(crimes.data);
});

// Initial Visualization of the Crime Data
function update(crimes) {
	var svgContainer = d3.select("svg");


	// Default Display all crimes
	var circles = svgContainer.selectAll("circle")
						.data(crimes)
						.attr("class", "update");


	// Color by time of day
	var color = d3.scale.ordinal().range(["#ff7f0e", "#17becf", "#1f77b4"]);


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
