/*jshint esversion: 6 */
(function() {

/* ============ START GLOBAL VARIABLE DEFINITIONS ============ */
// get the svg map
var svgContainer = d3.select("svg");

const pinSize = 26, // width and height of map pins
	defaultRadius = 175; // default city radius in pixels (must be in miles)

var mileToPixelRatio = 0; // how many pixels are in a mile

const colorA = "#7BCC70",
	colorB = "#72587F";

// Define the div for the tooltip
 var div = d3.select("body").append("div")
	 .attr("class", "tooltip")
	 .style("opacity", 0);

// Global Filters Array
var filters = [[],{},{},{},{}];

// Indexes of Different Filters
const WEEKDAY_FILTER = 0;
const DATERANGE_FILTER = 1;
const INTERSECTION_FILTER = 2;
const TIME_FILTER = 3;
const CATEGORY_FILTER = 4;
/* ============= END GLOBAL VARIABLE DEFINITIONS ============== */



/*
 * SOURCE FOR THIS FUNCTION USED
 * https://www.geodatasource.com/developers/javascript
 * ====================================================
 * get distance between two points in miles
 */
function distance(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180;
	var radlat2 = Math.PI * lat2/180;
	var theta = lon1-lon2;
	var radtheta = Math.PI * theta/180;
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist);
	dist = dist * 180/Math.PI;
	dist = dist * 60 * 1.1515;
	if (unit=="K") { dist = dist * 1.609344; }
	if (unit=="N") { dist = dist * 0.8684; }
	return dist;
}

// Calculates the mile to pixel ratio used in adjusting the city radius
// (Takes in 2 arrays of longitude and latitude for two data points)
function calculateMPR(coords1, coords2) {
	// get corresponding pixel values of coordinates
	var pixels1 = projection(coords1),
		pixels2 = projection(coords2);

	// get distance between two points in pixels
	var pixelX = pixels1[0] - pixels2[0];
	var pixelY = pixels1[1] - pixels2[1];
	var pixelDistance = Math.sqrt((pixelX * pixelX) + (pixelY * pixelY));

	// coords array are [lon, lat] while distance functions takes lat then long
	var mileDistance = distance(coords1[1], coords1[0], coords2[1], coords2[0], "M");
	//var mileDistance = d3.geo.distance(coords1, coords2);
	//console.log(mileDistance + " = distance in miles");

	return (pixelDistance / mileDistance);
}


// Load data, setup controls
d3.json("scpd-incidents.json", function(error, crimes) {
	if (error) throw error;

	// calculate mile-to-pixel ratio
	mileToPixelRatio = calculateMPR(crimes.data[0].Location, crimes.data[crimes.data.length/2].Location);

	drawCityPins(200, 375, 450, 375, crimes.data); //default pin locations
	setUpControls(crimes.data);
});



/* ================ START CITY PIN DRAGGABLE FUNCTIONALITY =============== */



// Draw the city pins and make them draggable!
function drawCityPins(Ax, Ay, Bx, By, crimes) {

	var drag = d3.behavior.drag()
		.on("drag", function() {
			var dragged = d3.select(this);
			var radius = pinSize / 2;
			var svgWidth = parseInt(svgContainer.attr("width")),
				svgHeight = parseInt(svgContainer.attr("height"));

			dragged
				.attr("x", Math.max(radius, Math.min(svgWidth - radius, d3.event.x) - radius))
				.attr("y", Math.max(radius, Math.min(svgHeight - radius, d3.event.y) - radius));


			// drag city radius with the pin as well
			var cityRad;
			if (dragged.attr("id") == "cityA") cityRad = d3.select("#radiusA");
			else cityRad = d3.select("#radiusB");
			cityRad
				.attr("cx", Math.max(parseInt(dragged.attr("x")) + radius, Math.min(svgWidth - radius, d3.event.x)))
				.attr("cy", Math.max(parseInt(dragged.attr("y")) + radius, Math.min(svgHeight - radius, d3.event.y)));
			update(filterCrimes(crimes));
		})
		.on("dragend", function() {
			update(filterCrimes(crimes));
		});

	// Draw radius around pin A
	svgContainer.append("ellipse")
		.attr("cx", Ax + (pinSize / 2))
		.attr("cy", Ay + (pinSize / 2))
		.attr("rx", defaultRadius)
		.attr("ry", defaultRadius)
		.attr("class", "cityRadius")
		.attr("id", "radiusA")
		.style("opacity", "0.2")
		.style("fill", colorA);

	// Draw radius around pin B
	svgContainer.append("ellipse")
		.attr("cx", Bx + (pinSize / 2))
		.attr("cy", By + (pinSize / 2))
		.attr("rx", defaultRadius)
		.attr("ry", defaultRadius)
		.attr("class", "cityRadius")
		.attr("id", "radiusB")
		.style("opacity", "0.35")
		.style("fill", colorB);

	// City A push pin
	svgContainer.append("image")
		.attr("x", Ax)
  		.attr("y", Ay)
  		.attr("height", pinSize)
  		.attr("width", pinSize)
  		.attr("xlink:href", "assets/citymarker.png")
  		.attr("class", "cityPins")
  		.attr("id", "cityA")
		.style("opacity", "0.9")
		.call(drag);

	// City B push pin
	svgContainer.append("image")
		.attr("x", Bx)
  		.attr("y", By)
  		.attr("height", pinSize)
  		.attr("width", pinSize)
		.attr("xlink:href", "assets/citymarker.png")
		.attr("class", "cityPins")
		.attr("id", "cityB")
		.style("opacity", "0.9")
		.call(drag);


}

// Redraw pins over the data points after every update
/*function redrawCityPins(crimes) {
	if (svgContainer.selectAll(".cityPins")) {
		var Ax = d3.select("#cityA").attr("x"),
			Ay = d3.select("#cityA").attr("y"),
			Bx = d3.select("#cityB").attr("x"),
			By = d3.select("#cityB").attr("y");

		svgContainer.selectAll(".cityPins").remove();
		drawCityPins(Ax, Ay, Bx, By, crimes);
	}
} */
/* ============== END CITY PIN DRAGGABLE FUNCTIONALITY =============== */




/* ============ START CITY RADIUS FUNCTIONALITY =============== */

// Initialize sliders
var sliderA = $("#sliderA"),
	sliderB = $("#sliderB");

// Make sliders slide and control radii of cities
sliderA.slider();
sliderA.on("slide", function(slideEvt) {
	$("#sliderAVal").text(Math.round((slideEvt.value / mileToPixelRatio) * 10) / 10); //display radius in miles
	d3.select("#radiusA")
		.attr("rx", slideEvt.value)
		.attr("ry", slideEvt.value);
});

sliderB.slider();
sliderB.on("slide", function(slideEvt) {
	$("#sliderBVal").text(Math.round((slideEvt.value / mileToPixelRatio) * 10) / 10); //display radius in miles
	d3.select("#radiusB")
		.attr("rx", slideEvt.value)
		.attr("ry", slideEvt.value);
});

// Styling slider handles
//$(".slider-handle").css("border-radius", "2px");

// Changing colors of the slider knobs to match the cities
$("#Aknob .slider-handle")
	.css("background-color", colorA)
	.css("background-image", "none");
$("#Bknob .slider-handle")
	.css("background-color", colorB)
	.css("background-image", "none");

$("#Aknob .slider-selection")
	.css("background-color", "#ccc")
	.css("background-image", "none");
$("#Bknob .slider-selection")
	.css("background-color", "#ccc")
	.css("background-image", "none");

/* ============ END CITY RADIUS FUNCTIONALITY ================*/



function setUpControls(crimes) {

	// Handle Weekday Checkbox Settings
	$("#weekdayfilter :input").change(function() {
		var day = this.value;
		if (this.checked) {
			var i = filters[WEEKDAY_FILTER].indexOf(day);
			if(i != -1) {
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
		var tempmax = new Date($("#datepickermax")[0].value);
		tempmax.setDate(tempmax.getDate()+1);
		filters[DATERANGE_FILTER].max = tempmax;
		update(filterCrimes(crimes));
	});


	// Handle Intersection Data
	var cityA = d3.select("#radiusA"),
		cityB = d3.select("#radiusB");
	var pointA = projection.invert([parseInt(cityA.attr("cx")), parseInt(cityA.attr("cy"))]),
		pointB = projection.invert([parseInt(cityB.attr("cx")), parseInt(cityB.attr("cy"))]);

	filters[INTERSECTION_FILTER].A = pointA;
	filters[INTERSECTION_FILTER].B = pointB;


	// Handle Time of Day Slider
	$("#time-slider").slider({
		formatter: function(value) {
			// Update tooltip
			return getConvertedTime(value[0]) + " to " + getConvertedTime(value[1]);
		}
	}).on("slide", function(event) {
		$("#timerangelabel")[0].innerHTML = getConvertedTime(event.value[0]) + " to " + getConvertedTime(event.value[1]);
		filters[TIME_FILTER].min = event.value[0];
		filters[TIME_FILTER].max = event.value[1];
		update(filterCrimes(crimes));
	});
	$("#sliderTime .slider-handle")
		.css("width", "5px")
		.css("margin-left", "-2px")
		.css("background-color", "#666")
		.css("background-image", "none");
	$("#sliderTime .slider-selection")
		.css("background-color", "#ccc")
		.css("background-image", "none");


	// Handle Crime Categories
	$('.dropdown-menu').on("click", function(event) {
		event.preventDefault();
		var text = event.target.text;
		if(text) {
			if(text === "All Crimes") {
				filters[CATEGORY_FILTER].category = null;
				$('#categoryButton').text("Select Category: All Crimes");
			} else {
				filters[CATEGORY_FILTER].category = text.toUpperCase();
				$('#categoryButton').text("Select Category: " + text);
			}
			update(filterCrimes(crimes));
		}
	});

	//Initialize visual
	update(filterCrimes(crimes));
}

function getConvertedTime(value) {
	var convertedtime;
	if(value === 0) {
		convertedtime = "12:00 AM";
	} else if(value < 12) {
		convertedtime = value + ":00 AM";
	} else if(value === 12) {
		convertedtime = "12:00 PM";
	} else if(value === 24) {
		convertedtime = "11:59 PM";
	} else {
		convertedtime = value%12 + ":00 PM";
	}
	return convertedtime;
}


function setUpDatePicker(crimes) {
	var maxdate = new Date(d3.max(crimes, function(d) { return d.Date;} ));
	var mindate = new Date(d3.min(crimes, function(d) { return d.Date;} ));
	maxdate.setDate(maxdate.getDate()+2);
	mindate.setDate(mindate.getDate()+1);
	filters[DATERANGE_FILTER].min = mindate;
	filters[DATERANGE_FILTER].max = maxdate;

	// Set up Date Range selector
	var datepicker = $('.input-daterange').datepicker({
		startDate: mindate,
		endDate: maxdate,
		defaultViewDate: { year: mindate.getFullYear(), month: mindate.getMonth(), day: mindate.getDate() },
	    autoclose: true,
	    todayHighlight: true,
	});
}


// Filters crimes based on Weekday, Date range, and intersection
function filterCrimes(crimes) {
	var curr_crimes = crimes.filter(function(value) {

		//Filter Days of Week
		for(var i = 0; i < filters[WEEKDAY_FILTER].length; i++) {
			if(value.DayOfWeek === filters[WEEKDAY_FILTER][i]) {
				return false;
			}
		}

		//Filter Date Range
		var val_date = new Date(value.Date);
		val_date.setDate(val_date.getDate()+1);
		if(val_date < filters[DATERANGE_FILTER].min || val_date >= filters[DATERANGE_FILTER].max) {
			return false;
		}

		//Filter Time of Day
		var val_hour = parseInt(value.Time.slice(0,2));
		var val_min = parseInt(value.Time.slice(3));
		if(val_hour < filters[TIME_FILTER].min || val_hour > filters[TIME_FILTER].max) {
			return false;
		} else if(val_hour == filters[TIME_FILTER].max && val_min > 0) {
			return false;
		}

		//Filter Intersection
		var distFromA = distance(filters[INTERSECTION_FILTER].A[1],
								 filters[INTERSECTION_FILTER].A[0],
								 value.Location[1], value.Location[0], "M"),
			distFromB = distance(filters[INTERSECTION_FILTER].B[1],
								 filters[INTERSECTION_FILTER].B[0],
								 value.Location[1], value.Location[0], "M");
		var maxAdist = d3.select("#radiusA").attr("rx"),
			maxBdist = d3.select("#radiusB").attr("rx");
		// distA has to be less than radius of A AND distB has to be less than radius B to be in intersection
		if (distFromA * mileToPixelRatio > maxAdist || distFromB * mileToPixelRatio > maxBdist) {
			return false;
		}

		//Filter Crime Category
		if(filters[CATEGORY_FILTER].category) {
			if(filters[CATEGORY_FILTER].category !== value.Category) {
				return false;
			}
		}

		return true;

	});

	return curr_crimes;
}



// Update crime data and city pins
function update(crimes) {

	// Select all data points
	var circles = svgContainer.selectAll("circle")
						.data(crimes)
						.attr("class", "update");

	circles.enter().append("circle").attr("class","enter")
		.attr("cx", function (d) { return projection(d.Location)[0]; })
		.attr("cy", function (d) { return projection(d.Location)[1]; })
		.attr("r", 2)

		.on("mouseover", function(d) {
			this.setAttribute('r', 10);
			this.setAttribute("style", "fill: #F57C00");
            div.transition()
                .duration(200)
				.style("opacity", 0.9);
            div.html(d.Category + "<br/>Resolution: " + d.Resolution + "<br/>" + d.DayOfWeek)
                .style("left", (d3.event.pageX - 60) + "px")
                .style("top", (d3.event.pageY - 70) + "px");
            })
        .on("mouseout", function(d) {
			this.setAttribute('r', 2);
			this.setAttribute("style", "fill: #8C1717");
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })
		.on("mouseenter", function(d) {
			this.parentElement.appendChild(this);
		})

		.style("fill", "#8C1717");


	circles.exit().remove();

	//redrawCityPins(crimes); // redraw the city pins
}

})();
