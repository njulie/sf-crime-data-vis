// load the data
d3.json("scpd-incidents.json", function(error, crimes) {
	if (error) throw error;
	plotInitialData(crimes.data);
});


function plotInitialData(crimes) {
	var svgContainer = d3.select("svg");

	// Default Display all crimes
	var circles = svgContainer.selectAll("circle")
						.data(crimes)
						.enter()
						.append("circle");

	// Color by time of day
	var color = d3.scale.ordinal()
				.range(["#ff7f0e", "#17becf", "#1f77b4"]);


	var circleAttributes = circles
							.attr("cx", function (d) { return projection(d.Location)[0]; })
							.attr("cy", function (d) { return projection(d.Location)[1]; })
							.attr("r", 2)
							// Color By Time of Day
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
}
