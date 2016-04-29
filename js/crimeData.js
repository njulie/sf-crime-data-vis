// load the data
d3.json("scpd-incidents.json", function(error, crimes) {
	if (error) throw error;
	plotInitialData(crimes.data);
});


function plotInitialData(crimes) {
	var svgContainer = d3.select("svg");

	console.log(crimes[0]);
	console.log(projection(crimes[0].Location));

	var circles = svgContainer.selectAll("circle")
						.data(crimes)
						.enter()
						.append("circle");

	var circleAttributes = circles
							.attr("cx", function (d) { return projection(d.Location)[0]; })
							.attr("cy", function (d) { return projection(d.Location)[1]; })
							.attr("r", 5)
							.style("fill", "purple");
}
