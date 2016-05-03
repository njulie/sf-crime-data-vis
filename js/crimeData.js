(function() {
// get the svg map
var svgContainer = d3.select("svg");


// Morning: pastel purple
// Afternoon/Evening: purple
// Night: dark purple/black
var color = d3.scale.ordinal().range(["#ddd1e7", "#663096", "#190729"]);

// Global Filters Array
var filters = [[],{}];

// Indexes of Different Filters
const WEEKDAY_FILTER = 0;
const DATERANGE_FILTER =1;


// load the data
d3.json("scpd-incidents.json", function(error, crimes) {
	if (error) throw error;

	drawCityPins(200, 375, 450, 375);
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
}

// This function draws the city pins and makes them draggable!
function drawCityPins(Ax, Ay, Bx, By) {

	var drag = d3.behavior.drag()
		.on("drag", mover);

	// City A push pin
	svgContainer.append("image")
		.attr("x", Ax)
  		.attr("y", Ay)
  		.attr("height", 60)
  		.attr("width", 60)
  		.attr("xlink:href", "assets/citymarker.png")
  		.attr("class", "cityPins")
  		.attr("id", "cityA")
		.style("opacity", "0.87")
		.call(drag);

	// City B push pin
	svgContainer.append("image")
		.attr("x", Bx)
  		.attr("y", By)
  		.attr("height", 60)
  		.attr("width", 60)
		.attr("xlink:href", "assets/citymarker.png")
		.attr("class", "cityPins")
		.attr("id", "cityB")
		.style("opacity", "0.87")
		.call(drag);

}


function redrawCityPins(d) {
	if (svgContainer.selectAll(".cityPins")) {
		var Ax = d3.select("#cityA").attr("x"),
			Ay = d3.select("#cityA").attr("y"),
			Bx = d3.select("#cityB").attr("x"),
			By = d3.select("#cityB").attr("y");

		svgContainer.selectAll(".cityPins").remove();
		drawCityPins(Ax, Ay, Bx, By);
	}
}


function setUpControls(crimes) {

	// Handle Weekday Checkbox Settings
	$(".weekdayCheckbox").on("click", function(){
		var day = this.value;
		if (this.checked) {
			var i = filters[WEEKDAY_FILTER].indexOf(day);
			if(i !== -1) {
				filters[WEEKDAY_FILTER].splice(i, 1);
			}
		} else {
			filters[WEEKDAY_FILTER].push(day);
		}
		update(filterCrimes(crimes));
	});

	// Display Date Picker
	setUpDatePicker(crimes);
	$('.input-daterange').datepicker().on("changeDate", function(e) {
		filters[DATERANGE_FILTER].min = new Date($("#datepickermin")[0].value);
		filters[DATERANGE_FILTER].max = new Date($("#datepickermax")[0].value);
		update(filterCrimes(crimes));
	});

	//Initialize visual
	update(crimes);
}

function setUpDatePicker(crimes) {
	var maxdate = new Date(d3.max(crimes, function(d) { return d.Date;} ));
	var mindate = new Date(d3.min(crimes, function(d) { return d.Date;} ));
	maxdate.setDate(maxdate.getDate()+1);
	mindate.setDate(mindate.getDate()+1);
	// Set up Date Range selector
	var datepicker = $('.input-daterange').datepicker({
		startDate: mindate,
		endDate: maxdate,
		defaultViewDate: { year: mindate.getFullYear(), month: mindate.getMonth(), day: mindate.getDate() },
	    autoclose: true,
	    todayHighlight: true,
	});
}

function filterCrimes(crimes) {
	var curr_crimes = crimes.filter(function(value) {
		var indicator = true;
		//Filter Days of Week
		for(var i = 0; i < filters[WEEKDAY_FILTER].length; i++) {
			if(value.DayOfWeek === filters[WEEKDAY_FILTER][i]) {
				return false;
			}
		}
		//Filter Date Range
		var val_date = new Date(value.Date);
		val_date.setDate(val_date.getDate()+1);
		if(val_date > filters[DATERANGE_FILTER].max || val_date < filters[DATERANGE_FILTER].min) {
			return false;
		}
		return true;
	});
	return curr_crimes;
}

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

		// Set Color Attributes by Time of Day
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

	redrawCityPins(); // redraw the city pins
}

})();
