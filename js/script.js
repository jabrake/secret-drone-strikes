var w = $(window).width()/2;
var h = $(window).height();
var DCLat = 38.897876;
var DCLon = -77.036492;
var DCLatLon = new google.maps.LatLng(DCLat, DCLon);
var droneData = [];
var flag = null;
var sortDistance = null;
var initialLocation = undefined;
var myLat, myLong, vis;

function getDronestreamData() {

    // var URL = "http://api.dronestre.am/data";
    var URL = "data/data.json";

    $.ajax({
        url: URL,
        type: 'GET',
        dataType: 'json',
        error: function(msg){
            console.log("we got problems!");
        },

        success: function(data){

            droneData = data.strike;
        }

    }).then(function() {

        $.when(calculateDistances()).done(animateVis());
    });
}

function calculateDistances() {

    // $("#container").fadeOut(400);
    $("#container").css('visibility', 'hidden');

    for (var i = 0; i < droneData.length; i++) {

        var strikeLat = droneData[i].lat;
        var strikeLon = droneData[i].lon;

        var strikeLatLon = new google.maps.LatLng(strikeLat, strikeLon);

        var calcDistance = google.maps.geometry.spherical.computeDistanceBetween(initialLocation, strikeLatLon);

        droneData[i].distance = calcDistance;
        droneData[i].hoverCounter = 0;
    }

    var sortedDrones = _.sortBy(droneData, 'distance');
      
    var minDistance = sortedDrones[0].distance;
    var maxDistance = sortedDrones[sortedDrones.length-1].distance;

    var adding = 0;

    var cScale = d3.scale.linear()
        .domain([0, 526])
        .range([0, 2 * Math.PI]);

    var dataScale = d3.scale.linear()
        .domain([minDistance, maxDistance])
        .range([50, 300]);

    vis = d3.select("body")
        .append("svg")
        .attr('width', w)
        .attr('height', h)
        .attr('id', 'chart');

    var arc = d3.svg.arc()
        .innerRadius(30)
        .outerRadius(function (d) {
            return dataScale(d.distance);
        })
        .startAngle(function (d) {
            return cScale(adding);
        })
        .endAngle(function (d) {
            adding ++;
            return cScale(adding);
        });

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    vis.selectAll("path")
    .data(droneData)
    .enter()
    .append("path")
    .on("mouseover", function (d) {

        div.transition()
            .duration(200)
            .style("opacity", 1.0);

        div.html(function() {
            var strikeLat = Number(d.lat);
            var strikeLon = Number(d.lon);
            var strikeLatShort = strikeLat.toPrecision(8);
            var strikeLonShort = strikeLon.toPrecision(8);
            var location = strikeLatShort + "°, " + strikeLonShort + "°";

            //Number of deaths
            var deaths = d.deaths;

            if (deaths === "Unknown") {
                deaths = "unknown";
            }

            //Format distance
            var distance = Math.ceil(d.distance);
            var distanceComma = Number(distance).toLocaleString('en');

            //Date
            var date = d.date;
            var newDate = date.substr(0, 10).split("-");
            var displayDate = newDate[1] + "/" + newDate[2] + "/" + newDate[0];

            //Link
            var link = d.bij_link;

            //Determine country to dynamically select flag
            // var country = d.country;
            if (d.country == "Pakistan") {
                flag = "assets/pakistan.png";
            } else if (d.country == "Somalia") {
                flag = "assets/somalia.png";
            } else if (d.country == "Yemen") {
                flag = "assets/yemen.png";
            }

            //var display = "<h2>Distance: " + distanceComma + " meters from you" + "<br>Location: " + location + "<br>Casualties: " + deaths + "<br>Date: " + dateFormat + "</h2><br><img class='flag' src=" + flag + "></img>";
            var display = "Date: " + displayDate + "<br>Country: " + d.country + "<br>Distance: " + distanceComma + " meters away from you<br>Casualties: " + deaths;

            return display;
        })
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 65) + "px");

        d.hoverCounter++;

        d3.select(this)
        .transition()
        .duration(250)
        .style("fill", "red");
    })

    .on("mouseout", function (d) {
        d3.select(this)
        .transition()
        .duration(500)
        .style("fill", "black");

        div.transition()
            .duration(500)
            .style("opacity", 0);
    })
    .attr("d", arc)
    .style("fill", "#eee")
    .style("cursor", "pointer")
    .attr("transform", "translate(" + w*0.5 + ", " + h*0.5 + ")");

}

function animateVis() {

    vis.selectAll("path")
    .transition()
    .duration(500)
    .style("fill", "black");

    setTimeout(function() {
        vis.selectAll("path")
        .transition()
        .duration(500)
        .style("fill", "black");
        // .style("fill", "#eee");
    }, 500);
}

function getLocation() {

    //Get geolocation
    if(navigator.geolocation) {

        $("#container").html("Calculating distances between you and drone strikes...");

        browserSupportFlag = true;

        navigator.geolocation.getCurrentPosition(function(position) {

            initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            myLat = initialLocation.k;
            myLong = initialLocation.A;

            var myLatShort = myLat.toPrecision(8);
            var myLongShort = myLong.toPrecision(8);

            var myLocation = myLatShort + "°,<br>" + myLongShort + "°";

            // $("#myLocation").html(myLocation);
            getDronestreamData();

        },

        function() {
            handleNoGeolocation(browserSupportFlag);
        });
    }


    //If browser doesn't support geolocation
    else {
        browserSupportFlag = false;
        handleNoGeolocation(browserSupportFlag);
    }
}

function handleNoGeolocation(errorFlag) {
    if (errorFlag === true) {
        alert("Geolocation service failed.");
    } else {
        alert("Your browser doesn't support geolocation. We've placed you in Washington, D.C.");
        initialLocation = DCLatLon;
    }
}

$(document).ready(function() {


    getLocation();

    $("h1").click(function() {
    });
});