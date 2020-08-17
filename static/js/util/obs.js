var observations;
var obsDisplayed = false;
var obsType = "weather";
var obsTimeframe = "latest"
var networkSelected = "ALL";
var temperatureUnit = "F";
var accumulationPeriod = 1;
var accumStartDatetime, accumEndDatetime;
var historicalDatetime;
var obsInterval;
var obsFilters = {
	'gust': { 'min': 0, 'max': 150 },
	'temp': { 'min': -80, 'max': 130 },
	'elev': { 'min': -300, 'max': 14000 },
	'rh': { 'min': 0, 'max': 100 },
	'precip': { 'min': 0, 'max': 18 }
}
var cloud_codes = ["Missing","Clear","Scattered","Broken","Overcast","Obscured","Thin Scattered","Thin Broken","Thin Overcast","Thin Obscured"];
var gustFilter = [obsFilters['gust'].min, obsFilters['gust'].max];
var gustFilterEnabled = false;
var tempFilter = [obsFilters['temp'].min, obsFilters['temp'].max];
var tempFilterEnabled = false;
var rhFilter = [obsFilters['rh'].min, obsFilters['rh'].max];
var rhFilterEnabled = false;
var elevFilter = [obsFilters['elev'].min, obsFilters['elev'].max];
var elevFilterEnabled = false;
var precipFilter = [0.01, obsFilters['precip'].max];
var precipFilterEnabled = true;
var filtersArray = [gustFilterEnabled, tempFilterEnabled, rhFilterEnabled, elevFilterEnabled, precipFilterEnabled];
var mesoToken = "d8c6aee36a994f90857925cea26934be"

$("#density-info").tooltip({ placement: "bottom", html: "<div style='width:150px;'>The higher the density setting, the more observations will be displayed.  You must zoom in to enable higher densities. <b>NOTE:</b> Higher densities will increase load times.</div>" });

var obsUnits = {
	"weather": "temp|F,speed|mph",
	"historical": "temp|F,speed|mph",
	"air_temp": "temp|F",
	"road_temp": "temp|F",
	"dew_point": "temp|F",
	"wind_gust": "speed|mph",
	"wind_chill": "temp|f",
	"heat_index": "temp|f",
	"wind_gust_kts": "speed|kts",
	"firewx": "speed|mph",
	"air_temp_change_24_hour": "temp|f",
	"air_temp_high_24_hour": "temp|f",
	"air_temp_low_24_hour": "temp|f",
	"wind_gust_high_24_hour": "speed|mph",
	"wave_height": "height|ft"
}

var obsVariables = {
	"weather": "air_temp,wind_speed,wind_gust,wind_direction,relative_humidity,dew_point_temperature,sea_level_pressure,cloud_layer_1_code,cloud_layer_2_code,cloud_layer_3_code",
	"air_temp": "air_temp",
	"road_temp": "road_temp",
	"dew_point": "dew_point_temperature",
	"wind_gust": "wind_gust",
	"wind_chill": "wind_chill",
	"heat_index": "heat_index",
	"wind_gust_kts": "wind_gust",
	"relative_humidity": "relative_humidity",
	"visibility": "visibility",
	"firewx": "wind_speed,relative_humidity",
	"air_temp_change_24_hour": "air_temp",
	"air_temp_high_24_hour": "air_temp",
	"air_temp_low_24_hour": "air_temp",
	"wind_gust_high_24_hour": "wind_gust",
	"relative_humidity_high_24_hour": "relative_humidity",
	"relative_humidity_low_24_hour": "relative_humidity",
	"relative_humidity_change_24_hour": "relative_humidity",
}
var obExcludeNetwork = [203]

var obsNetworks = {
	"NWS/FAA": "1,5,10,14,96,106",
	"RAWS": "2",
	"NWS/RAWS": "1,2,5,10",
	"APRSWXNET/CWOP": "65",
	"SNOTEL": "25",
	"Transportation":"4,15,16,22,36,41,49,59,63,64,71,90,91,97,98,98,99,100,101,102,103,104,105,118,119,132,149,158,159,160,161,162,163,164,165,166,167,168,169,185,206,210",
	"Maritime":"96",
	"ALL": ""
}

// grid filter configs

var obsDensity = 60;
var obsImportance = "1,2,153,4,15,16,22,36,41,49,59,63,64,71,90,91,97,98,98,99,100,101,102,103,104,105,118,119,132,149,158,159,160,161,162,163,164,165,166,167,168,169,185,206,210"
var obsHover = false;
var json_data1, json_data2;
var providers = []
$.ajax({ url: "/map/js/mw_networks.json", type: "POST", cache: false, dataType: 'json',
	success: function(data) {
		providers = data
	}
});

/**
 * Add/Remove observations from the map
 */
function toggleObservations() {
	if ($("#obs-enable").is(":checked")) {

		$("#load-div").show();
		$("#obs-alert").hide()

		if (obsDisplayed) { removeObservationLayer(); }

		var bounds = map.getBounds();
		var boundingBox = checkLongitude(bounds.getSouthWest().lng).toFixed(2) + "," + bounds.getSouthWest().lat.toFixed(2) + "," + checkLongitude(bounds.getNorthEast().lng).toFixed(2) + "," + bounds.getNorthEast().lat.toFixed(2);

		var apiUrl = "";
		var apiQuery = {};

		/*** BUILD THE API URL */
		if(obsType.indexOf("change") >= 0) {

			//////////////////////////////////////////
			// 24 hour change obs
			//////////////////////////////////////////

			apiUrl = "https://api.synopticlabs.org/v2/stations/nearesttime";
			var apiQueryEnd = { token: mesoToken, bbox: boundingBox, vars: obsVariables[obsType], units: obsUnits[obsType], networkimportance: obsImportance, status: "active", within: 90 }
			var apiQueryStart = { token: mesoToken, bbox: boundingBox, vars: obsVariables[obsType], units: obsUnits[obsType], networkimportance: obsImportance, status: "active", within: 90 }
			if (networkSelected != "ALL") {	apiQuery["network"] = obsNetworks[networkSelected] }
			if (obsDensity > 10) {
				apiQueryEnd["height"] = mapHeight; apiQueryEnd["width"] = mapWidth; apiQueryEnd["spacing"] = obsDensity;
				apiQueryStart["height"] = mapHeight; apiQueryStart["width"] = mapWidth; apiQueryStart["spacing"] = obsDensity;
			}
			var startDate, endDate;
			if(obsTimeframe == "historical") { endDate = new Date(historicalDatetime);	} else { endDate = new Date(); }
			startDate = new Date(endDate)
			startDate.setHours(startDate.getHours() - 24);
			apiQueryEnd["attime"] = dateFormat(endDate, "UTC:yyyymmddHHMM")
			apiQueryStart["attime"] = dateFormat(startDate, "UTC:yyyymmddHHMM")

			$.when($.ajax({ url: apiUrl, data: apiQueryEnd, dataType: 'json' }), $.ajax({ url: apiUrl, data: apiQueryStart, dataType: 'json' })).done(function(json_end, json_start) {
				json_data1 = json_end;
				json_data2 = json_start;
				parseChangeResult(json_data1,json_data2);
			});

		} else if(obsType == "precip") {

			//////////////////////////////////////////
			// precip obs
			//////////////////////////////////////////

			apiUrl = "https://api.synopticlabs.org/v2/stations/precipitation";
			apiQuery = { token: mesoToken, bbox: boundingBox, networkimportance: obsImportance, units: "english", within: 90, status: "active" }
			if (networkSelected != "ALL") { apiQuery["network"] = obsNetworks[networkSelected] }
			if (obsDensity > 10) {
				apiQuery["height"] = mapHeight; apiQuery["width"] = mapWidth; apiQuery["spacing"] = obsDensity;
			}

			if(obsTimeframe == "latest") {
				var endDate = new Date();
				var startDate = new Date();
				startDate.setHours(startDate.getHours() - accumulationPeriod);
				apiQuery["start"] = dateFormat(startDate, "UTC:yyyymmddHHMM");
				apiQuery["end"] = dateFormat(endDate, "UTC:yyyymmddHHMM");
			} else {
				apiQuery["start"] = dateFormat(accumStartDatetime, "UTC:yyyymmddHHMM");
				apiQuery["end"] = dateFormat(accumEndDatetime, "UTC:yyyymmddHHMM");
			}

			$.ajax({
				url: apiUrl, type: "GET", data: apiQuery, cache: false, dataType: 'json',
				success: function(json) {
					json_data1 = json;
					parsePrecipResult(json_data1)
				},
				error: function(xhr, status, error) {
					console.log("Error retreiving precip observations: " + error);
					// show error and hide loading
					$("#obs-alert").show();
					$("#load-div").hide();
					// still watch for map movement and refresh obs
					map.on("moveend", toggleObservations);
					// update the layer timestamp
					createObsTimestamp(true);
					// enable auto-refresh
					obsAutoupdate(true);
					// legend
					viewObsLegend(true);
					obsDisplayed = true;
				}
			});
		} else {

			//////////////////////////////////////////
			// All non 24hr change & non precip obs
			//////////////////////////////////////////

			if(obsTimeframe == "latest") {

				//////////////////////////////////////////
				// latest everything else
				//////////////////////////////////////////

				apiUrl = "https://api.synopticlabs.org/v2/stations/latest";
				apiQuery = { token: mesoToken, bbox: boundingBox, networkimportance: obsImportance, minmax: 1, minmaxtype: "local", units: "temp|f,speed|mph", within: 90, status: "active" }
				if (networkSelected != "ALL") { apiQuery["network"] = obsNetworks[networkSelected] }
				if (obsDensity > 10) {
					apiQuery["height"] = mapHeight; apiQuery["width"] = mapWidth; apiQuery["spacing"] = obsDensity;
				}

				$.ajax({
					url: apiUrl, type: "GET", data: apiQuery, cache: false, dataType: 'json',
					success: function(json) {
						json_data1 = json;
						parseLatestResult(json_data1);
					},
					error: function(xhr,status,error) {
						console.log("Error retrieving latest observations: " + error);
						// show error and hide loading
						$("#obs-alert").show();
						$("#load-div").hide();
						// still watch for map movement and refresh obs
						map.on("moveend", toggleObservations);
						// update the layer timestamp
						createObsTimestamp(true);
						// enable auto-refresh
						obsAutoupdate(true);
						// legend
						viewObsLegend(true);
						obsDisplayed = true;
					}
				})

			} else {

				//////////////////////////////////////////
				// historical obs
				//////////////////////////////////////////

				apiUrl = "https://api.synopticlabs.org/v2/stations/nearesttime"
				apiQuery = { token: mesoToken, bbox: boundingBox, networkimportance: obsImportance, units: "temp|f,speed|mph", within: 90, status: "active" }
				apiQuery["attime"] = dateFormat(historicalDatetime, "UTC:yyyymmddHHMM")
				apiQuery["within"] = 90;
				if (networkSelected != "ALL") { apiQuery["network"] = obsNetworks[networkSelected] }
				if (obsDensity > 10) {
					apiQuery["height"] = mapHeight; apiQuery["width"] = mapWidth; apiQuery["spacing"] = obsDensity;
				}

				var apiUrlStats = "https://api.synopticlabs.org/v2/stations/statistics";
				var endDate = new Date(historicalDatetime);
				var startDate = new Date(historicalDatetime);
				startDate.setHours(0,0,0,0);
				var apiQueryStats = { token: mesoToken, bbox: boundingBox, vars: "air_temp,wind_gust,relative_humidity", start: dateFormat(startDate, "UTC:yyyymmddHHMM"), end: dateFormat(endDate, "UTC:yyyymmddHHMM"), networkimportance: obsImportance, units: obsUnits[obsType], within: 1440, type: "all", status: "active" }
				if (obsDensity > 10) {
					apiQueryStats["height"] = mapHeight; apiQueryStats["width"] = mapWidth; apiQueryStats["spacing"] = obsDensity;
				}

				$.when($.ajax({ url: apiUrl, data: apiQuery, dataType: 'json' }), $.ajax({ url: apiUrlStats, data: apiQueryStats, dataType: 'json' })).done(function(json_hist, json_stats) {
					json_data1 = json_hist;
					json_data2 = json_stats;
					parseHistoricalResult(json_data1,json_data2);
				});
			}
		}
	} else {
		if (obsDisplayed) {
			// remove layer and hide loading
			removeObservationLayer();
			// update layer timestamp
			createObsTimestamp(false);
			// legend
			viewObsLegend(false);
			map.closePopup();
			$("#load-div").hide();
		}
	}
}

/**
 * PARSE HISTORICAL RESULTS
 */
function parseHistoricalResult(data,data_stats) {

	if (data[1] == "success" && data[0].STATION && data[0].STATION.length > 0) {
		$("#numobs-alert").hide();
		$("#accum-alert").hide();
		$("#zoom-alert").hide();

		observations = data[0].STATION;
		stats_maxmin = (data_stats[1] == "success" && data_stats[0].STATION && data_stats[0].STATION.length > 0) ? data_stats[0].STATION : [];

		var maxmin = {};
		for(var stat in stats_maxmin) {
			maxmin[stats_maxmin[stat].STID] = {};
			maxmin[stats_maxmin[stat].STID].temp_max_value = (stats_maxmin[stat].STATISTICS.air_temp_set_1 && stats_maxmin[stat].STATISTICS.air_temp_set_1.maximum) ? stats_maxmin[stat].STATISTICS.air_temp_set_1.maximum : "N/A";
			maxmin[stats_maxmin[stat].STID].temp_max_valid = (stats_maxmin[stat].STATISTICS.air_temp_set_1 && stats_maxmin[stat].STATISTICS.air_temp_set_1.maxtime) ? dateFormat(stats_maxmin[stat].STATISTICS.air_temp_set_1.maxtime, "m/d/yyyy h:MM TT Z") : "N/A";
			maxmin[stats_maxmin[stat].STID].rh_max_value = (stats_maxmin[stat].STATISTICS.relative_humidity_set_1 && stats_maxmin[stat].STATISTICS.relative_humidity_set_1.maximum) ? stats_maxmin[stat].STATISTICS.relative_humidity_set_1.maximum : "N/A"
			maxmin[stats_maxmin[stat].STID].rh_max_valid = (stats_maxmin[stat].STATISTICS.relative_humidity_set_1 && stats_maxmin[stat].STATISTICS.relative_humidity_set_1.maxtime) ? dateFormat(stats_maxmin[stat].STATISTICS.relative_humidity_set_1.maxtime, "m/d/yyyy h:MM TT Z") : "N/A";
			maxmin[stats_maxmin[stat].STID].gust_max_value = (stats_maxmin[stat].STATISTICS.wind_gust_set_1 && stats_maxmin[stat].STATISTICS.wind_gust_set_1.maximum) ? stats_maxmin[stat].STATISTICS.wind_gust_set_1.maximum : "N/A"
			maxmin[stats_maxmin[stat].STID].gust_max_valid = (stats_maxmin[stat].STATISTICS.wind_gust_set_1 && stats_maxmin[stat].STATISTICS.wind_gust_set_1.maxtime) ? dateFormat(stats_maxmin[stat].STATISTICS.wind_gust_set_1.maxtime, "m/d/yyyy h:MM TT Z") : "N/A";
			maxmin[stats_maxmin[stat].STID].temp_min_value = (stats_maxmin[stat].STATISTICS.air_temp_set_1 && stats_maxmin[stat].STATISTICS.air_temp_set_1.minimum) ? stats_maxmin[stat].STATISTICS.air_temp_set_1.minimum : "N/A";
			maxmin[stats_maxmin[stat].STID].temp_min_valid = (stats_maxmin[stat].STATISTICS.air_temp_set_1 && stats_maxmin[stat].STATISTICS.air_temp_set_1.mintime) ? dateFormat(stats_maxmin[stat].STATISTICS.air_temp_set_1.mintime, "m/d/yyyy h:MM TT Z") : "N/A";
			maxmin[stats_maxmin[stat].STID].rh_min_value = (stats_maxmin[stat].STATISTICS.relative_humidity_set_1 && stats_maxmin[stat].STATISTICS.relative_humidity_set_1.minimum) ? stats_maxmin[stat].STATISTICS.relative_humidity_set_1.minimum : "N/A"
			maxmin[stats_maxmin[stat].STID].rh_min_valid = (stats_maxmin[stat].STATISTICS.relative_humidity_set_1 && stats_maxmin[stat].STATISTICS.relative_humidity_set_1.mintime) ? dateFormat(stats_maxmin[stat].STATISTICS.relative_humidity_set_1.mintime, "m/d/yyyy h:MM TT Z") : "N/A";
		}

		for (var s in observations) {

			// collect station metadata
			var stn_id = observations[s].STID;
			var stn_name = observations[s].NAME;
			var stn_latitude = parseFloat(observations[s].LATITUDE);
			var stn_longitude = parseFloat(observations[s].LONGITUDE);
			var stn_elevation = observations[s].ELEVATION;
			var mnet_id = (providers[observations[s].MNET_ID]) ? providers[observations[s].MNET_ID].short_name : "N/A";
			var temp_f = (observations[s].OBSERVATIONS.air_temp_value_1 && observations[s].OBSERVATIONS.air_temp_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.air_temp_value_1.value) : "N/A";
			var temp_c = (temp_f != "N/A") ? (temp_f - 32) * (5 / 9) : "N/A";
			var temp_valid = (!isNaN(temp_f)) ? dateFormat(observations[s].OBSERVATIONS.air_temp_value_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
			var dew_f = (observations[s].OBSERVATIONS.dew_point_temperature_value_1d && observations[s].OBSERVATIONS.dew_point_temperature_value_1d.value) ? parseFloat(observations[s].OBSERVATIONS.dew_point_temperature_value_1d.value) : "N/A";
			var dew_c = (dew_f != "N/A") ? (dew_f - 32) * (5 / 9) : "N/A";
			var relh = (observations[s].OBSERVATIONS.relative_humidity_value_1 && observations[s].OBSERVATIONS.relative_humidity_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.relative_humidity_value_1.value) : "N/A";
			var winds = (observations[s].OBSERVATIONS.wind_speed_value_1 && observations[s].OBSERVATIONS.wind_speed_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.wind_speed_value_1.value) : "N/A";
			var wind_kts = (winds != "N/A") ? parseFloat(winds * 0.868976) : "N/A";
			var wind_dir = (winds != "N/A" && observations[s].OBSERVATIONS.wind_direction_value_1 && observations[s].OBSERVATIONS.wind_direction_value_1.value) ? parseInt(observations[s].OBSERVATIONS.wind_direction_value_1.value) : "N/A";
			var wind_card = (winds != "N/A" && observations[s].OBSERVATIONS.wind_cardinal_direction_value_1d && observations[s].OBSERVATIONS.wind_cardinal_direction_value_1d.value) ? (observations[s].OBSERVATIONS.wind_cardinal_direction_value_1d.value).trim() : "N/A";
			var gust = (observations[s].OBSERVATIONS.wind_gust_value_1 && observations[s].OBSERVATIONS.wind_gust_value_1.value) ? Math.round(parseFloat(observations[s].OBSERVATIONS.wind_gust_value_1.value)) : "N/A";
			var gust_kts = (gust != "N/A") ? parseFloat(gust * 0.868976) : "N/A";
			var gust_valid = (!isNaN(gust)) ? dateFormat(new Date(observations[s].OBSERVATIONS.wind_gust_value_1.date_time), "m/d/yyyy h:MM TT Z") : "N/A";
			var chill = (observations[s].OBSERVATIONS.wind_chill_value_1d && observations[s].OBSERVATIONS.wind_chill_value_1d.value) ? Math.round(parseFloat(observations[s].OBSERVATIONS.wind_chill_value_1d.value)) : "N/A";
			var hindex = (observations[s].OBSERVATIONS.heat_index_value_1d && observations[s].OBSERVATIONS.heat_index_value_1d.value) ? Math.round(parseFloat(observations[s].OBSERVATIONS.heat_index_value_1d.value)) : "N/A";
			var alt = (observations[s].OBSERVATIONS.altimeter_value_1 && observations[s].OBSERVATIONS.altimeter_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.altimeter_value_1.value * 0.0002953).toFixed(2) : "N/A";
			var vis = (observations[s].OBSERVATIONS.visibility_value_1 && observations[s].OBSERVATIONS.visibility_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.visibility_value_1.value).toFixed(2) : "N/A";
			var slp = (typeof observations[s].OBSERVATIONS.sea_level_pressure_value_1 !== 'undefined') ? parseFloat(observations[s].OBSERVATIONS.sea_level_pressure_value_1.value / 100).toFixed(1) : "NaN";
			var cld1 = (typeof observations[s].OBSERVATIONS.cloud_layer_1_code_value_1 !== 'undefined') ? (observations[s].OBSERVATIONS.cloud_layer_1_code_value_1.value).toString() : "NaN";
			var cloud_str = ""
			if(parseInt(cld1) == 1) { cloud_str += "Clear"}
			else if(parseInt(cld1) > 1) {
				var cld_coverage = parseInt(cld1.slice(-1));
				var cld_hgt = parseInt(cld1.slice(0,cld1.length-1))
				cloud_str += cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
			}
			var cld2 = (typeof observations[s].OBSERVATIONS.cloud_layer_2_code_value_1 !== 'undefined') ? (observations[s].OBSERVATIONS.cloud_layer_2_code_value_1.value).toString() : "NaN";
			if(parseInt(cld2) == 1) { cloud_str += "Clear" } else if(parseInt(cld2) > 1) {
				var cld_coverage = parseInt(cld2.slice(-1));
				var cld_hgt = parseInt(cld2.slice(0,cld2.length-1))
				if(cloud_str != "") {
					cloud_str += "<br>" + cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
				} else {
					cloud_str += cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
				}
			}
			var cld3 = (typeof observations[s].OBSERVATIONS.cloud_layer_3_code_value_1 !== 'undefined') ? (observations[s].OBSERVATIONS.cloud_layer_3_code_value_1.value).toString() : "NaN";
			if(parseInt(cld3) == 1) { cloud_str += "Clear" }
			else if(parseInt(cld3) > 1) {
				var cld_coverage = parseInt(cld3.slice(-1));
				var cld_hgt = parseInt(cld3.slice(0,cld3.length-1))
				if(cloud_str != "") {
					cloud_str += "<br>" + cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
				} else {
					cloud_str += cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
				}
			}
			var wx = (observations[s].OBSERVATIONS.weather_condition_value_1d && observations[s].OBSERVATIONS.weather_condition_value_1d.value) ? observations[s].OBSERVATIONS.weather_condition_value_1d.value : "N/A";

			// parse max/min values
			if(maxmin[stn_id]) {
				var maxt_f = maxmin[stn_id].temp_max_value;
				var maxt_f_valid = maxmin[stn_id].temp_max_valid;
				var maxt_c = (maxt_f != "N/A") ? (maxt_f - 32) * (5 / 9) : "N/A";
				var max_relh = maxmin[stn_id].rh_max_value;
				var max_relh_valid = maxmin[stn_id].rh_max_valid;
				var max_gust = maxmin[stn_id].gust_max_value;
				var max_gust_valid = maxmin[stn_id].gust_max_valid;
				var max_gust_kts = (max_gust != "N/A") ? parseFloat(max_gust * 0.868976) : "N/A";
				var mint_f = maxmin[stn_id].temp_min_value;
				var mint_f_valid = maxmin[stn_id].temp_min_valid;
				var mint_c = (mint_f != "N/A") ? (mint_f - 32) * (5 / 9) : "N/A";
				var min_relh = maxmin[stn_id].rh_min_value;
				var min_relh_valid = maxmin[stn_id].rh_min_valid;
			} else {
				var maxt_f = "N/A";
				var maxt_f_valid = "N/A";
				var maxt_c = "N/A";
				var max_relh = "N/A";
				var max_relh_valid = "N/A";
				var max_gust = "N/A";
				var max_gust_valid = "N/A";
				var max_gust_kts = "N/A";
				var mint_f =  "N/A";
				var mint_f_valid = "N/A";
				var mint_c = "N/A";
				var min_relh = "N/A";
				var min_relh_valid = "N/A";
			}

			var water_temp_f = (observations[s].OBSERVATIONS.T_water_temp_value_1 && observations[s].OBSERVATIONS.T_water_temp_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.T_water_temp_value_1.value) : "N/A";
			var water_temp_c = (water_temp_f != "N/A") ? (water_temp_f - 32) * (5/9) : "N/A";
			var wave_height = (observations[s].OBSERVATIONS.wave_height_value_1 && observations[s].OBSERVATIONS.wave_height_value_1.value) ? (parseFloat(observations[s].OBSERVATIONS.wave_height_value_1.value) * 3.28084).toFixed(1) : "N/A";
			var wave_period = (observations[s].OBSERVATIONS.wave_period_value_1 && observations[s].OBSERVATIONS.wave_period_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.wave_period_value_1.value) : "N/A";
			var prim_swell_hgt = (observations[s].OBSERVATIONS.primary_swell_wave_height_value_1 && observations[s].OBSERVATIONS.primary_swell_wave_height_value_1.value) ? (parseFloat(observations[s].OBSERVATIONS.primary_swell_wave_height_value_1.value) * 3.28084).toFixed(1) : "N/A";
			var prim_swell_per = (observations[s].OBSERVATIONS.primary_swell_wave_period_value_1 && observations[s].OBSERVATIONS.primary_swell_wave_period_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.primary_swell_wave_period_value_1.value) : "N/A";
			var prim_swell_dir = (observations[s].OBSERVATIONS.primary_swell_true_direction_value_1 && observations[s].OBSERVATIONS.primary_swell_true_direction_value_1.value) ? observations[s].OBSERVATIONS.primary_swell_true_direction_value_1.value : "N/A";

			var html = "<div style='min-width:225px;font-size:0.9em;margin-top:5px;font-family:'Avenir Next W00', 'Avenir Next', Avenir;'>";
			html += "	<div class='row' style='background:rgb(245,245,245);margin-top:20px;border:1px solid #959595;'>";
			html += "		<div class='col-xs-4' style='padding:1px 0px 1px 3px;'><font style='font-size:1.1em;font-weight:bold;'>" + stn_id + "</font></div>";
			html += "		<div class='col-xs-8' style='padding:1px 3px 1px 0px;text-align:right;'> " + stn_latitude.toFixed(2) + "/" + stn_longitude.toFixed(2) + " @ " + stn_elevation + "ft." + "</div>";
			html += "	</div>";
			html += "	<div class='row' style='margin-top:5px;'>";
			html += "		<div class='col-xs-4' style='padding:0px;'>Name: </div>";
			html += "		<div class='col-xs-8' style='padding:0px;'> " + stn_name + "</div>";
			html += "	</div>";
			if(mnet_id != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-4' style='padding:0px;'>Provider: </div>";
				html += "		<div class='col-xs-8' style='padding:0px;'> " + mnet_id + "</div>";
				html += "	</div>";
			}
			if(temp_valid != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-4' style='padding:0px;'>Valid: </div>";
				html += "		<div class='col-xs-8' style='padding:0px;'> " + (temp_valid !== "N/A") ? dateFormat(new Date(temp_valid), "dd mmm h:MM TT Z") : "N/A" + "</div>";
				html += "	</div>";
				html += "<hr style='margin:3px 0px;border-top: 1px solid #000;width:100% !important;'>";
			}

			if (temp_f != "N/A") {

				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + temp_valid + "'>Temp: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(temp_f) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(temp_c) + " &deg;C</div>";
				html += "	</div>";
			}
			if (dew_f != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Dew Point: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(dew_f) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(dew_c) + " &deg;C</div>";
				html += "	</div>";
			}
			if (relh != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Relh: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(relh) + " %</div>";
				html += "	</div>";
			}
			if (winds != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wind Speed: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(winds) + " mph</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(wind_kts) + " kts</div>";
				html += "	</div>";
			}
			if (wind_dir != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wind Dir: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + wind_card + "</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + wind_dir + "&deg;</div>";
				html += "	</div>";
			}
			if (gust != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + gust_valid + "'>Gust: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(gust) + " mph</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(gust_kts) + " kts</div>";
				html += "	</div>";
			}
			if (hindex != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Heat Index: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(hindex) + " &deg;F</div>";
				html += "	</div>";
			}
			if (chill != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wind Chill: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(chill) + " &deg;F</div>";
				html += "	</div>";
			}
			if (alt != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Altimeter: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + alt + " in</div>";
				html += "	</div>";
			}
			if (vis != "N/A") {
				if(vis < 0) { vis = "< " + (vis * -1); }
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Visibility: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + vis + " mi</div>";
				html += "	</div>";
			}
			if (wx != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Weather: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + wx + "</div>";
				html += "	</div>";
			}
			if (cloud_str != "") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Clouds: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + cloud_str + "</div>";
				html += "	</div>";
			}
			if(water_temp_f != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Water Temp: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(water_temp_f) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(water_temp_c) + " &deg;C</div>";
				html += "	</div>";
			}
			if(wave_height != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wave Height: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + wave_height + " ft</div>";
				html += "	</div>";
			}
			if(wave_period != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wave Period: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + wave_period + " sec</div>";
				html += "	</div>";
			}
			if(prim_swell_hgt != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prim Swell Hgt: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + prim_swell_hgt + " ft</div>";
				html += "	</div>";
			}
			if(prim_swell_per != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prim Swell Per: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + prim_swell_per + " sec</div>";
				html += "	</div>";
			}
			if(prim_swell_dir != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prim Swell Dir: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + prim_swell_dir + "&deg;</div>";
				html += "	</div>";
			}
			// if ((maxt_f != "N/A" || mint_f != "N/A" || max_relh != "N/A" || min_relh != "N/A" || max_gust != "N/A") && obsType != "hist_precip") {
				html += "	<div class='row' style='background:rgb(245,245,245);border:1px solid #959595;margin-top:5px;'>";
				html += "		<div class='col-xs-12' style='padding:1px 0px 1px 3px;text-align:center;'><font style='font-weight:bold;'>High & Lows Since Station Midnight</font></div>";
				html += "	</div>";
				if (maxt_f != "N/A") {
					html += "	<div class='row' style='margin-top:5px;'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + maxt_f_valid + "'>Max Temp: </div>";
					html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(maxt_f) + " &deg;F</div>";
					html += "		<div class='col-xs-3' style='padding:0 0 0 10px;'> " + Math.round(maxt_c) + " &deg;C</div>";
					html += "	</div>";
				}
				if (mint_f != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + mint_f_valid + "'>Min Temp: </div>";
					html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(mint_f) + " &deg;F</div>";
					html += "		<div class='col-xs-3' style='padding:0 0 0 10px;'> " + Math.round(mint_c) + " &deg;C</div>";
					html += "	</div>";
				}
				if (max_relh != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + max_relh_valid + "'>Max RH: </div>";
					html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(max_relh) + " %</div>";
					html += "	</div>";
				}
				if (min_relh != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + min_relh_valid + "'>Min RH: </div>";
					html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(min_relh) + " %</div>";
					html += "	</div>";
				}
				if (max_gust != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + max_gust_valid + "'>Max Gust: </div>";
					html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(max_gust) + " mph</div>";
					html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(max_gust_kts) + " kts</div>";
					html += "	</div>";
				}

			// what parameter should be displayed
			if (obsType == "air_temp" || obsType == "air_tempc") {
				var passedFilters = checkFilters([temp_f, stn_elevation]);
				if (!isNaN(temp_f) && passedFilters) {
					var colorStyle = (obsType == "air_temp" || obsType == "hist_air_temp") ? calculateTempColor(temp_f, "F") : calculateTempColor(temp_f, "C");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(temp_f) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id, "air_temp":  Math.round(temp_f), "elev": stn_elevation};
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "dew_point" || obsType == "dew_pointc") {
				var passedFilters = checkFilters([dew_f, stn_elevation]);
				if (!isNaN(dew_f) && passedFilters) {
					var colorStyle = (obsType == "dew_point" || obsType == "hist_dew_point") ? calculateTempColor(dew_f, "F") : calculateTempColor(dew_f, "C");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(dew_f) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id, "dew_point":  Math.round(dew_f)};
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "relative_humidity") {
				var passedFilters = checkFilters([relh, stn_elevation]);
				if (!isNaN(relh) && passedFilters) {
					var colorStyle = calculateRhColor(relh);
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(relh) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id, "relativ_humidity": Math.round(relh) };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "wind_gust" || obsType == "wind_gust_kts") {
				var passedFilters = checkFilters([gust, stn_elevation]);

				if (!isNaN(gust) && passedFilters) {
					var colorStyle = (obsType == "wind_gust" || obsType == "hist_wind_gust") ? calculateWindColor(gust, "mph") : calculateWindColor(gust, "kts");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(gust) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id, "wind_gust": Math.round(gust)};
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "wind_chill") {
				var passedFilters = checkFilters([chill, stn_elevation]);

				if (!isNaN(chill) && passedFilters) {
					var colorStyle = calculateTempColor(chill, "F");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(chill) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id, "wind_chill": Math.round(chill)};
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "heat_index") {
				var passedFilters = checkFilters([hindex, stn_elevation]);

				if (!isNaN(hindex) && passedFilters) {
					var colorStyle = calculateTempColor(hindex, "F");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(hindex) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id, "heat_index": Math.round(hindex)};
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "visibility") {
				var passedFilters = checkFilters([stn_elevation]);
				if (!isNaN(vis) && passedFilters) {
					var colorStyle = calculateVisColor(vis, "mi");
					if (colorStyle) {
						if(vis < 0) { vis = "< " + (vis * -1); }
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + vis + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id, "visibility": vis};
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "weather") {
				var passedFilters = checkFilters([temp_f, gust, relh, stn_elevation]);
				if (passedFilters) {
					var wxHtml = createStationPlot(temp_f, dew_f, wind_kts, wind_dir, slp, gust, relh, cld1, cld2, cld3);
					var wxIcon = L.divIcon({ className: 'wx-icon', html: wxHtml, iconSize: [40, 40] })
					var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
					if (obsHover) {
						wxMarker.on("mouseover", function(e) { this.openPopup(); })
						wxMarker.on("mouseout", function(e) { this.closePopup(); })
						wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
					}
					wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
					obsLayer.addLayer(wxMarker);
				} else {
					console.log(stn_id)
				}
			} else if (obsType == "firewx") {
				var passedFilters = checkFilters([winds, relh, stn_elevation]);

				if (passedFilters) {
					var fireHtml = createFireIcon(winds, relh); // "<div class='fire-left' style='background:yellow;'>W</div><div class='fire-right' style='background:green;'>H</div>";
					var wxIcon = L.divIcon({ className: 'wx-icon', html: fireHtml, iconSize: [40, 40] })
					var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
					if (obsHover) {
						wxMarker.on("mouseover", function(e) { this.openPopup(); })
						wxMarker.on("mouseout", function(e) { this.closePopup(); })
						wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
					}
					wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
					obsLayer.addLayer(wxMarker);
				}
			} else if (obsType == "air_temp_high_24_hour" || obsType == "air_temp_low_24_hour") {
				var mtemp = (obsType == "air_temp_high_24_hour") ? maxt_f : mint_f;
				var passedFilters = checkFilters([mtemp, stn_elevation]);

				if (passedFilters) {
					var colorStyle = calculateTempColor(mtemp, "F");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(mtemp) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "wind_gust_high_24_hour") {
				var passedFilters = checkFilters([max_gust, stn_elevation]);

				if (!isNaN(max_gust) && passedFilters) {
					var colorStyle = calculateWindColor(max_gust, "mph");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(max_gust) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "relative_humidity_high_24_hour" || obsType == "relative_humidity_low_24_hour") {
				var mrelh = (obsType == "relative_humidity_high_24_hour") ? max_relh : min_relh;
				var passedFilters = checkFilters([mrelh, stn_elevation]);

				if (!isNaN(mrelh) && passedFilters) {
					var colorStyle = calculateRhColor(mrelh);
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(mrelh) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			}
		}

		obsDisplayed = true;

		// watch for map movement and refresh obs
		map.on("moveend", toggleObservations);

		// hide loading
		$("#load-div").hide();

		// update the layer timestamp
		createObsTimestamp(true);

		// enable auto-refresh
		obsAutoupdate(true);

		// legend
		viewObsLegend(true);

	} else {
		// show alerts and hide loading
		$("#numobs-alert").show();
		$("#load-div").hide();

		// watch for map movement and refresh obs
		map.on("moveend", toggleObservations);

		// update the layer timestamp
		createObsTimestamp(true);

		// enable auto-refresh
		obsAutoupdate(true);

		// legend
		viewObsLegend(true);
		obsDisplayed = true;

	}
}

/**
 * PARSE PRECIP API RESULT
 */
function parsePrecipResult(data) {
	if (data.STATION && data.STATION.length > 0) {
		$("#numobs-alert").hide();
		observations = data.STATION;

		for (var s in observations) {

			// collect station metadata
			var stn_id = observations[s].STID;
			var stn_name = observations[s].NAME;
			var stn_latitude = parseFloat(observations[s].LATITUDE);
			var stn_longitude = parseFloat(observations[s].LONGITUDE);
			var stn_elevation = observations[s].ELEVATION;
			var mnet_id = (providers[observations[s].MNET_ID]) ? providers[observations[s].MNET_ID].short_name : "N/A";

			var precipitationAmount = (typeof observations[s].OBSERVATIONS.total_precip_value_1 !== "undefined") ? parseFloat(observations[s].OBSERVATIONS.total_precip_value_1).toFixed(2) : "NaN";
			var obEndTime = (typeof observations[s].OBSERVATIONS.ob_end_time_1 !== "undefined") ? dateFormat(new Date(observations[s].OBSERVATIONS.ob_end_time_1), "m/d/yyyy h:MM TT Z") : "NaN";
			var obStartTime = (typeof observations[s].OBSERVATIONS.ob_start_time_1 !== "undefined") ? dateFormat(new Date(observations[s].OBSERVATIONS.ob_start_time_1), "m/d/yyyy h:MM TT Z") : "NaN";

			var html = "<div style='min-width:225px;font-size:0.9em;margin-top:5px;font-family:'Avenir Next W00', 'Avenir Next', Avenir;'>";
			html += "	<div class='row' style='background:rgb(245,245,245);margin-top:20px;border:1px solid #959595;'>";
			html += "		<div class='col-xs-4' style='padding:1px 0px 1px 3px;'><font style='font-size:1.1em;font-weight:bold;'>" + stn_id + "</font></div>";
			html += "		<div class='col-xs-8' style='padding:1px 3px 1px 0px;text-align:right;'> " + stn_latitude.toFixed(2) + "/" + stn_longitude.toFixed(2) + " @ " + stn_elevation + "ft." + "</div>";
			html += "	</div>";
			html += "	<div class='row' style='margin-top:5px;'>";
			html += "		<div class='col-xs-4' style='padding:0px;'>Name: </div>";
			html += "		<div class='col-xs-8' style='padding:0px;'> " + stn_name + "</div>";
			html += "	</div>";
			if(mnet_id != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-4' style='padding:0px;'>Provider: </div>";
				html += "		<div class='col-xs-8' style='padding:0px;'> " + mnet_id + "</div>";
				html += "	</div>";
			}
			html += "	<div class='row' style='background:rgb(245,245,245);border:1px solid #959595;margin-top:5px;'>";
			html += "		<div class='col-xs-12' style='padding:1px 0px 1px 3px;'><font style='font-weight:bold;'>Precipitation Accumulation Valid</font></div>";
			html += "	</div>";
			html += "	<div class='row' style='margin-top:5px;'>";
			html += "		<div class='col-xs-5' style='padding:0px;'>Total: </div>";
			html += "		<div class='col-xs-7' style='padding:0px;'>" + precipitationAmount + " in.</div>";
			html += "	</div>";
			html += "	<div class='row'>";
			html += "		<div class='col-xs-5' style='padding:0px;'>Starting: </div>";
			html += "		<div class='col-xs-7' style='padding:0px;'>" + obStartTime + "</div>";
			html += "	</div>";
			html += "	<div class='row'>";
			html += "		<div class='col-xs-5' style='padding:0px;'>Ending:</div>";
			html += "		<div class='col-xs-7' style='padding:0px;'>" + obEndTime + "</div>";
			html += "	</div>";
			if(obsTimeframe == "latest") {
				if(!obsHover) {
					html += "	<div class='row' style='border-top:1px solid #959595;margin-top:5px;padding-top:5px;'>";
					html += '		<div class="col-xs-12" style="padding:0px;text-align:center;"><b>Historical Observations:</b> <a href="/mesowest/timeseries.php?sid=' + stn_id + '&num=72&banner=gmap&raw=0&w=325" target="_blank"><b>3 Day</b></a>&nbsp;&nbsp;<a href="/mesowest/timeseries.php?sid=' + stn_id + '&num=168&banner=gmap&raw=0&w=325" target="_blank"><b>7 Day</b></a></div>';
					html += "	</div>";
				} else {
					html += "	<div class='row' style='border-top:1px solid #959595;margin-top:5px;padding-top:5px;'>";
					html += '		<div class="col-xs-12" style="padding:0px;text-align:center;color:#196fa6;font-weight:bold;">Click Station Icon For 3 Day History</div>';
					html += "	</div>";
				}
			}

			var passedFilters = checkFilters([precipitationAmount, stn_elevation]);

			if (!isNaN(precipitationAmount) && passedFilters) {
				var colorStyle = calculatePrecipColor(precipitationAmount);
				if (colorStyle) {
					var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + precipitationAmount + "</div>" });
					var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
					if (obsHover) {
						wxMarker.on("mouseover", function(e) { this.openPopup(); })
						wxMarker.on("mouseout", function(e) { this.closePopup(); })
						wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
					}
					wxMarker.data = { "stid": stn_id, "endTime": obEndTime, "startTime": obStartTime, "amount": precipitationAmount, "mnet": mnet_id };
					obsLayer.addLayer(wxMarker)
				}
			}
		}


		obsDisplayed = true;
		// watch for map movement and refresh obs
		map.on("moveend", toggleObservations);

		$("#load-div").hide();
		// update the layer timestamp
		createObsTimestamp(true);
		// enable auto-refresh
		obsAutoupdate(true);
		// legend
		viewObsLegend(true);

	} else {
		$("#numobs-alert").show();
		$("#load-div").hide();
		map.on("moveend", toggleObservations);
		// update the layer timestamp
		createObsTimestamp(true);
		// enable auto-refresh
		obsAutoupdate(true);
		// legend
		viewObsLegend(true);
		obsDisplayed = true;

	}
}

/**
 * PARSE CHANGE API RESULT
 */
function parseChangeResult(jsonEnd,jsonStart) {
	var compareObs = {}
	if (jsonEnd[0].STATION && jsonEnd[0].STATION.length > 0) {
		var observations = jsonEnd[0].STATION;
		for (var s in observations) {
			// collect station metadata
			var stn = new Object;
			stn.id = observations[s].STID;
			stn.name = observations[s].NAME;
			stn.latitude = parseFloat(observations[s].LATITUDE);
			stn.longitude = parseFloat(observations[s].LONGITUDE);
			stn.elevation = observations[s].ELEVATION;
			stn.mnet = observations[s].MNET_ID;

			if (obsType == "air_temp_change_24_hour") {
				stn.endval = (typeof observations[s].OBSERVATIONS.air_temp_value_1 !== 'undefined') ? Math.round(parseFloat(observations[s].OBSERVATIONS.air_temp_value_1.value)) : "NaN";
				stn.endvalc = (!isNaN(stn.endval)) ? (stn.endval - 32) * (5 / 9) : "NaN";
				stn.enddate = (typeof observations[s].OBSERVATIONS.air_temp_value_1 !== 'undefined') ? dateFormat(observations[s].OBSERVATIONS.air_temp_value_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
			} else {
				stn.endval = (typeof observations[s].OBSERVATIONS.relative_humidity_value_1 !== 'undefined') ? Math.round(parseFloat(observations[s].OBSERVATIONS.relative_humidity_value_1.value)) : "NaN";
			}
			compareObs[observations[s].STID] = stn;
		}
	}
	if (jsonStart[0].STATION && jsonStart[0].STATION.length > 0) {
		var observations = jsonStart[0].STATION;
		for (var s in observations) {
			var id = observations[s].STID;
			if (compareObs[id]) {
				if (obsType == "air_temp_change_24_hour") {
					compareObs[id].startval = (typeof observations[s].OBSERVATIONS.air_temp_value_1 !== 'undefined') ? Math.round(parseFloat(observations[s].OBSERVATIONS.air_temp_value_1.value)) : "NaN";
					compareObs[id].startvalc = (!isNaN(compareObs[id].startval)) ? (compareObs[id].startval - 32) * (5 / 9) : "NaN";
					compareObs[id].startdate = (typeof observations[s].OBSERVATIONS.air_temp_value_1 !== 'undefined') ? dateFormat(observations[s].OBSERVATIONS.air_temp_value_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
				} else {
					compareObs[id].startval = (typeof observations[s].OBSERVATIONS.relative_humidity_value_1 !== 'undefined') ? Math.round(parseFloat(observations[s].OBSERVATIONS.relative_humidity_value_1.value)) : "NaN";
				}
			}
		}
	}



	for (var k in compareObs) {
		var passedFilters = checkFilters([compareObs[k].elevation]);
		if (!isNaN(compareObs[k].startval) && !isNaN(compareObs[k].endval) && passedFilters) {
			var diffVal = compareObs[k].endval - compareObs[k].startval;

			var html = "<div style='min-width:225px;font-size:0.9em;margin-top:5px;font-family:'Avenir Next W00', 'Avenir Next', Avenir;'>";
			html += "	<div class='row' style='background:rgb(245,245,245);margin-top:20px;border:1px solid #959595;'>";
			html += "		<div class='col-xs-4' style='padding:1px 0px 1px 3px;'><font style='font-size:1.1em;font-weight:bold;'>" + compareObs[k].id + "</font></div>";
			html += "		<div class='col-xs-8' style='padding:1px 3px 1px 0px;text-align:right;'> " + compareObs[k].latitude.toFixed(2) + "/" + compareObs[k].longitude.toFixed(2) + " @ " + compareObs[k].elevation + "ft." + "</div>";
			html += "	</div>";
			html += "	<div class='row' style='margin-top:5px;'>";
			html += "		<div class='col-xs-4' style='padding:0px;'>Name: </div>";
			html += "		<div class='col-xs-8' style='padding:0px;'> " + compareObs[k].name + "</div>";
			html += "	</div>";
			if(providers[compareObs[k].mnet] != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-4' style='padding:0px;'>Provider: </div>";
				html += "		<div class='col-xs-8' style='padding:0px;'> " + providers[compareObs[k].mnet].short_name + "</div>";
				html += "	</div>";
			}
			html += "<hr style='margin:3px 0px;border-top: 1px solid #000;width:100% !important;'>";

			if(obsType == "air_temp_change_24_hour") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Temp: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(compareObs[k].endval) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(compareObs[k].endvalc) + " &deg;C</div>";
				html += "	</div>";
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Valid: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + compareObs[k].enddate + "</div>";
				html += "	</div>";
				html += "	<div class='row' style='margin-top:5px;'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prev. Temp: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(compareObs[k].startval) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(compareObs[k].startvalc) + " &deg;C</div>";
				html += "	</div>";
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prev. Valid: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + compareObs[k].startdate + "</div>";
				html += "	</div>";
				if(!obsHover) {
					html += "	<div class='row' style='border-top:1px solid #959595;margin-top:5px;padding-top:5px;'>";
					html += '		<div class="col-xs-12" style="padding:0px;text-align:center;"><b>Historical Observations:</b> <a href="/mesowest/timeseries.php?sid=' + compareObs[k].id + '&num=72&banner=gmap&raw=0&w=325" target="_blank"><b>3 Day</b></a>&nbsp;&nbsp;<a href="/mesowest/timeseries.php?sid=' + compareObs[k].id + '&num=168&banner=gmap&raw=0&w=325" target="_blank"><b>7 Day</b></a></div>';
					html += "	</div>";
				} else {
					html += "	<div class='row' style='border-top:1px solid #959595;margin-top:5px;padding-top:5px;'>";
					html += '		<div class="col-xs-12" style="padding:0px;text-align:center;color:#196fa6;font-weight:bold;">Click Station Icon For 3 Day History</div>';
					html += "	</div>";
				}
			} else {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>RH: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(compareObs[k].endval) + " %</div>";
				html += "	</div>";
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Valid: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + compareObs[k].enddate + "</div>";
				html += "	</div>";
				html += "	<div class='row' style='margin-top:5px;'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prev. RH: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(compareObs[k].startval) + " %</div>";
				html += "	</div>";
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prev. Valid: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + compareObs[k].startdate + "</div>";
				html += "	</div>";
				if(!obsHover) {
					html += "	<div class='row' style='border-top:1px solid #959595;margin-top:5px;padding-top:5px;'>";
					html += '		<div class="col-xs-12" style="padding:0px;text-align:center;"><b>Historical Observations:</b> <a href="/mesowest/timeseries.php?sid=' + compareObs[k].id + '&num=72&banner=gmap&raw=0&w=325" target="_blank"><b>3 Day</b></a>&nbsp;&nbsp;<a href="/mesowest/timeseries.php?sid=' + compareObs[k].id + '&num=168&banner=gmap&raw=0&w=325" target="_blank"><b>7 Day</b></a></div>';
					html += "	</div>";
				} else {
					html += "	<div class='row' style='border-top:1px solid #959595;margin-top:5px;padding-top:5px;'>";
					html += '		<div class="col-xs-12" style="padding:0px;text-align:center;color:#196fa6;font-weight:bold;">Click Station Icon For 3 Day History</div>';
					html += "	</div>";
				}
			}

			var colorStyle;
			var colorStyle = (obsType == "air_temp_change_24_hour") ? calculateTempDiffColor(diffVal) : calculateRHDiffColor(diffVal);
			if (colorStyle) {
				var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + diffVal + "</div>" });
				var wxMarker = L.marker([compareObs[k].latitude, compareObs[k].longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
				if (obsHover) {
					wxMarker.on("mouseover", function(e) { this.openPopup(); })
					wxMarker.on("mouseout", function(e) { this.closePopup(); })
					wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + compareObs[k].id + "&num=72&banner=gmap&raw=0&w=325","_blank") });
				}
				// var wxMarker = L.marker([compareObs[k].latitude, compareObs[k].longitude], { icon: wxIcon });
				wxMarker.data = { "stid": compareObs[k].id };
				obsLayer.addLayer(wxMarker);
			}
		}
	}

	obsDisplayed = true;
	// watch for map movement and refresh obs
	map.on("moveend", toggleObservations);

	$("#load-div").hide();

	// update the layer timestamp
	createObsTimestamp(true);
	// enable auto-refresh
	obsAutoupdate(true);
	// legend
	viewObsLegend(true);
}

/**
 * PARSE LATEST API RESULT
 */
function parseLatestResult(data) {
	if (data.STATION && data.STATION.length > 0) {
		$("#numobs-alert").hide();
		$("#accum-alert").hide();
		$("#zoom-alert").hide();

		observations = data.STATION;

		for (var s in observations) {

			// collect station metadata
			var stn_id = observations[s].STID;
			var stn_name = observations[s].NAME;
			var stn_latitude = parseFloat(observations[s].LATITUDE);
			var stn_longitude = parseFloat(observations[s].LONGITUDE);
			var stn_elevation = observations[s].ELEVATION;
			var mnet_id = (providers[observations[s].MNET_ID]) ? providers[observations[s].MNET_ID].short_name : "N/A";
			var temp_f = (observations[s].OBSERVATIONS.air_temp_value_1 && observations[s].OBSERVATIONS.air_temp_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.air_temp_value_1.value) : "N/A";
			var temp_c = (temp_f != "N/A") ? (temp_f - 32) * (5 / 9) : "N/A";
			var temp_valid = (!isNaN(temp_f)) ? dateFormat(observations[s].OBSERVATIONS.air_temp_value_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
			var dew_f = (observations[s].OBSERVATIONS.dew_point_temperature_value_1d && observations[s].OBSERVATIONS.dew_point_temperature_value_1d.value) ? parseFloat(observations[s].OBSERVATIONS.dew_point_temperature_value_1d.value) : "N/A";
			var dew_c = (dew_f != "N/A") ? (dew_f - 32) * (5 / 9) : "N/A";
			var relh = (observations[s].OBSERVATIONS.relative_humidity_value_1 && observations[s].OBSERVATIONS.relative_humidity_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.relative_humidity_value_1.value) : "N/A";
			var winds = (observations[s].OBSERVATIONS.wind_speed_value_1 && observations[s].OBSERVATIONS.wind_speed_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.wind_speed_value_1.value) : "N/A";
			var wind_kts = (winds != "N/A") ? parseFloat(winds * 0.868976) : "N/A";
			var wind_dir = (winds != "N/A" && observations[s].OBSERVATIONS.wind_direction_value_1 && observations[s].OBSERVATIONS.wind_direction_value_1.value) ? parseInt(observations[s].OBSERVATIONS.wind_direction_value_1.value) : "N/A";
			var wind_card = (winds != "N/A" && observations[s].OBSERVATIONS.wind_cardinal_direction_value_1d && observations[s].OBSERVATIONS.wind_cardinal_direction_value_1d.value) ? (observations[s].OBSERVATIONS.wind_cardinal_direction_value_1d.value).trim() : "N/A";
			var gust = (observations[s].OBSERVATIONS.wind_gust_value_1 && observations[s].OBSERVATIONS.wind_gust_value_1.value) ? Math.round(parseFloat(observations[s].OBSERVATIONS.wind_gust_value_1.value)) : "N/A";
			var gust_kts = (gust != "N/A") ? parseFloat(gust * 0.868976) : "N/A";
			var gust_valid = (!isNaN(gust)) ? dateFormat(new Date(observations[s].OBSERVATIONS.wind_gust_value_1.date_time), "m/d/yyyy h:MM TT Z") : "N/A";
			var chill = (observations[s].OBSERVATIONS.wind_chill_value_1d && observations[s].OBSERVATIONS.wind_chill_value_1d.value) ? Math.round(parseFloat(observations[s].OBSERVATIONS.wind_chill_value_1d.value)) : "N/A";
			var hindex = (observations[s].OBSERVATIONS.heat_index_value_1d && observations[s].OBSERVATIONS.heat_index_value_1d.value) ? Math.round(parseFloat(observations[s].OBSERVATIONS.heat_index_value_1d.value)) : "N/A";
			var alt = (observations[s].OBSERVATIONS.altimeter_value_1 && observations[s].OBSERVATIONS.altimeter_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.altimeter_value_1.value * 0.0002953).toFixed(2) : "N/A";
			var vis = (observations[s].OBSERVATIONS.visibility_value_1 && observations[s].OBSERVATIONS.visibility_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.visibility_value_1.value).toFixed(2) : "N/A";
			var slp = (typeof observations[s].OBSERVATIONS.sea_level_pressure_value_1 !== 'undefined') ? parseFloat(observations[s].OBSERVATIONS.sea_level_pressure_value_1.value / 100).toFixed(1) : "NaN";
			var cld1 = (typeof observations[s].OBSERVATIONS.cloud_layer_1_code_value_1 !== 'undefined') ? (observations[s].OBSERVATIONS.cloud_layer_1_code_value_1.value).toString() : "NaN";
			var cloud_str = ""
			if(parseInt(cld1) == 1) { cloud_str += "Clear"}
			else if(parseInt(cld1) > 1) {
				var cld_coverage = parseInt(cld1.slice(-1));
				var cld_hgt = parseInt(cld1.slice(0,cld1.length-1))
				cloud_str += cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
			}
			var cld2 = (typeof observations[s].OBSERVATIONS.cloud_layer_2_code_value_1 !== 'undefined') ? (observations[s].OBSERVATIONS.cloud_layer_2_code_value_1.value).toString() : "NaN";
			if(parseInt(cld2) == 1) { cloud_str += "Clear" } else if(parseInt(cld2) > 1) {
				var cld_coverage = parseInt(cld2.slice(-1));
				var cld_hgt = parseInt(cld2.slice(0,cld2.length-1))
				if(cloud_str != "") {
					cloud_str += "<br>" + cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
				} else {
					cloud_str += cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
				}
			}
			var cld3 = (typeof observations[s].OBSERVATIONS.cloud_layer_3_code_value_1 !== 'undefined') ? (observations[s].OBSERVATIONS.cloud_layer_3_code_value_1.value).toString() : "NaN";
			if(parseInt(cld3) == 1) { cloud_str += "Clear" }
			else if(parseInt(cld3) > 1) {
				var cld_coverage = parseInt(cld3.slice(-1));
				var cld_hgt = parseInt(cld3.slice(0,cld3.length-1))
				if(cloud_str != "") {
					cloud_str += "<br>" + cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
				} else {
					cloud_str += cloud_codes[cld_coverage] + " @ " + (cld_hgt * 100) + " ft"
				}
			}
			var wx = (observations[s].OBSERVATIONS.weather_condition_value_1d && observations[s].OBSERVATIONS.weather_condition_value_1d.value) ? observations[s].OBSERVATIONS.weather_condition_value_1d.value : "N/A";

			if(observations[s].MINMAX) {
				var maxt_f = (observations[s].MINMAX.air_temp_value_1 && observations[s].MINMAX.air_temp_value_1.value_max_local[0] !== null) ? Math.round(parseFloat(observations[s].MINMAX.air_temp_value_1.value_max_local[0])) : "N/A";
				var maxt_f_valid = (observations[s].MINMAX.air_temp_value_1 && observations[s].MINMAX.air_temp_value_1.datetime_max_local[0] !== null) ? dateFormat(observations[s].MINMAX.air_temp_value_1.datetime_max_local[0], "m/d/yyyy h:MM TT Z") : "N/A";
				var maxt_c = (maxt_f != "N/A") ? (maxt_f - 32) * (5 / 9) : "N/A";
				var mint_f = (observations[s].MINMAX.air_temp_value_1 && observations[s].MINMAX.air_temp_value_1.value_min_local[0] !== null) ? Math.round(parseFloat(observations[s].MINMAX.air_temp_value_1.value_min_local[0])) : "N/A";
				var mint_f_valid = (observations[s].MINMAX.air_temp_value_1 && observations[s].MINMAX.air_temp_value_1.datetime_min_local[0] !== null) ? dateFormat(observations[s].MINMAX.air_temp_value_1.datetime_min_local[0], "m/d/yyyy h:MM TT Z") : "N/A";
				var mint_c = (mint_f != "N/A") ? (mint_f - 32) * (5 / 9) : "N/A";

				var max_relh = (observations[s].MINMAX.relative_humidity_value_1 && observations[s].MINMAX.relative_humidity_value_1.value_max_local[0] !== null) ? Math.round(parseFloat(observations[s].MINMAX.relative_humidity_value_1.value_max_local[0])) : "N/A";
				var max_relh_valid = (observations[s].MINMAX.relative_humidity_value_1 && observations[s].MINMAX.relative_humidity_value_1.datetime_max_local[0] !== null) ? dateFormat(observations[s].MINMAX.relative_humidity_value_1.datetime_max_local[0], "m/d/yyyy h:MM TT Z") : "N/A";
				var min_relh = (observations[s].MINMAX.relative_humidity_value_1 && observations[s].MINMAX.relative_humidity_value_1.value_min_local[0] !== null) ? Math.round(parseFloat(observations[s].MINMAX.relative_humidity_value_1.value_min_local[0])) : "N/A";
				var min_relh_valid = (observations[s].MINMAX.relative_humidity_value_1 && observations[s].MINMAX.relative_humidity_value_1.datetime_min_local[0] !== null) ? dateFormat(observations[s].MINMAX.relative_humidity_value_1.datetime_min_local[0], "m/d/yyyy h:MM TT Z") : "N/A";

				var max_gust = (observations[s].MINMAX.wind_gust_value_1 && observations[s].MINMAX.wind_gust_value_1.value_max_local[0] !== null) ? Math.round(parseFloat(observations[s].MINMAX.wind_gust_value_1.value_max_local[0])) : "N/A";
				var max_gust_valid = (observations[s].MINMAX.wind_gust_value_1 && observations[s].MINMAX.wind_gust_value_1.datetime_max_local[0] !== null) ? dateFormat(observations[s].MINMAX.wind_gust_value_1.datetime_max_local[0], "m/d/yyyy h:MM TT Z") : "N/A";
				var max_gust_kts = (max_gust != "N/A") ? parseFloat(max_gust * 0.868976) : "N/A";
			} else {
				var maxt_f = "N/A";
				var maxt_f_valid = "N/A";
				var maxt_c = "N/A";
				var mint_f = "N/A";
				var mint_f_valid = "N/A";
				var mint_c = "N/A";

				var max_relh = "N/A";
				var max_relh_valid = "N/A";
				var min_relh = "N/A";
				var min_relh_valid = "N/A";

				var max_gust = "N/A";
				var max_gust_valid = "N/A";
				var max_gust_kts = "N/A";
			}

			var water_temp_f = (observations[s].OBSERVATIONS.T_water_temp_value_1 && observations[s].OBSERVATIONS.T_water_temp_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.T_water_temp_value_1.value) : "N/A";
			var water_temp_c = (water_temp_f != "N/A") ? (water_temp_f - 32) * (5/9) : "N/A";
			var wave_height = (observations[s].OBSERVATIONS.wave_height_value_1 && observations[s].OBSERVATIONS.wave_height_value_1.value) ? (parseFloat(observations[s].OBSERVATIONS.wave_height_value_1.value) * 3.28084).toFixed(1) : "N/A";
			var wave_period = (observations[s].OBSERVATIONS.wave_period_value_1 && observations[s].OBSERVATIONS.wave_period_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.wave_period_value_1.value) : "N/A";
			var prim_swell_hgt = (observations[s].OBSERVATIONS.primary_swell_wave_height_value_1 && observations[s].OBSERVATIONS.primary_swell_wave_height_value_1.value) ? (parseFloat(observations[s].OBSERVATIONS.primary_swell_wave_height_value_1.value) * 3.28084).toFixed(1) : "N/A";
			var prim_swell_per = (observations[s].OBSERVATIONS.primary_swell_wave_period_value_1 && observations[s].OBSERVATIONS.primary_swell_wave_period_value_1.value) ? parseFloat(observations[s].OBSERVATIONS.primary_swell_wave_period_value_1.value) : "N/A";
			var prim_swell_dir = (observations[s].OBSERVATIONS.primary_swell_true_direction_value_1 && observations[s].OBSERVATIONS.primary_swell_true_direction_value_1.value) ? observations[s].OBSERVATIONS.primary_swell_true_direction_value_1.value : "N/A";

			var html = "<div style='min-width:225px;font-size:0.9em;margin-top:5px;font-family:'Avenir Next W00', 'Avenir Next', Avenir;'>";
			html += "	<div class='row' style='background:rgb(245,245,245);margin-top:20px;border:1px solid #959595;'>";
			html += "		<div class='col-xs-4' style='padding:1px 0px 1px 3px;'><font style='font-size:1.1em;font-weight:bold;'>" + stn_id + "</font></div>";
			html += "		<div class='col-xs-8' style='padding:1px 3px 1px 0px;text-align:right;'> " + stn_latitude.toFixed(2) + "/" + stn_longitude.toFixed(2) + " @ " + stn_elevation + "ft." + "</div>";
			html += "	</div>";
			html += "	<div class='row' style='margin-top:5px;'>";
			html += "		<div class='col-xs-4' style='padding:0px;'>Name: </div>";
			html += "		<div class='col-xs-8' style='padding:0px;'> " + stn_name + "</div>";
			html += "	</div>";
			if(mnet_id != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-4' style='padding:0px;'>Provider: </div>";
				html += "		<div class='col-xs-8' style='padding:0px;'> " + mnet_id + "</div>";
				html += "	</div>";
			}
			if(temp_valid != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-4' style='padding:0px;'>Valid: </div>";
				html += "		<div class='col-xs-8' style='padding:0px;'> " + (temp_valid !== "N/A") ? dateFormat(new Date(temp_valid), "dd mmm h:MM TT Z") : "N/A" + "</div>";
				html += "	</div>";
				html += "<hr style='margin:3px 0px;border-top: 1px solid #000;width:100% !important;'>";
			}

			if (temp_f != "N/A") {

				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + temp_valid + "'>Temp: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(temp_f) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(temp_c) + " &deg;C</div>";
				html += "	</div>";
			}
			if (dew_f != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Dew Point: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(dew_f) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(dew_c) + " &deg;C</div>";
				html += "	</div>";
			}
			if (relh != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Relh: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(relh) + " %</div>";
				html += "	</div>";
			}
			if (winds != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wind Speed: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(winds) + " mph</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(wind_kts) + " kts</div>";
				html += "	</div>";
			}
			if (wind_dir != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wind Dir: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + wind_card + "</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + wind_dir + "&deg;</div>";
				html += "	</div>";
			}
			if (gust != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + gust_valid + "'>Gust: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(gust) + " mph</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(gust_kts) + " kts</div>";
				html += "	</div>";
			}
			if (hindex != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Heat Index: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(hindex) + " &deg;F</div>";
				html += "	</div>";
			}
			if (chill != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wind Chill: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(chill) + " &deg;F</div>";
				html += "	</div>";
			}
			if (alt != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Altimeter: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + alt + " in</div>";
				html += "	</div>";
			}
			if (vis != "N/A") {
				if(vis < 0) { vis = "< " + (vis * -1); }
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Visibility: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + vis + " mi</div>";
				html += "	</div>";
			}
			if (wx != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Weather: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + wx + "</div>";
				html += "	</div>";
			}
			if (cloud_str != "") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Clouds: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + cloud_str + "</div>";
				html += "	</div>";
			}
			if(water_temp_f != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Water Temp: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(water_temp_f) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(water_temp_c) + " &deg;C</div>";
				html += "	</div>";
			}
			if(wave_height != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wave Height: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + wave_height + " ft</div>";
				html += "	</div>";
			}
			if(wave_period != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wave Period: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + wave_period + " sec</div>";
				html += "	</div>";
			}
			if(prim_swell_hgt != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prim Swell Hgt: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + prim_swell_hgt + " ft</div>";
				html += "	</div>";
			}
			if(prim_swell_per != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prim Swell Per: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + prim_swell_per + " sec</div>";
				html += "	</div>";
			}
			if(prim_swell_dir != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prim Swell Dir: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + prim_swell_dir + "&deg;</div>";
				html += "	</div>";
			}
			if ((maxt_f != "N/A" || mint_f != "N/A" || max_relh != "N/A" || min_relh != "N/A" || max_gust != "N/A") && obsType != "hist_precip") {
				html += "	<div class='row' style='background:rgb(245,245,245);border:1px solid #959595;margin-top:5px;'>";
				html += "		<div class='col-xs-12' style='padding:1px 0px 1px 3px;text-align:center;'><font style='font-weight:bold;'>High & Lows Since Station Midnight</font></div>";
				html += "	</div>";
				if (maxt_f != "N/A") {
					html += "	<div class='row' style='margin-top:5px;'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(maxt_f_valid), "dd mmm h:MM TT Z") + "'>Max Temp: </div>";
					html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(maxt_f) + " &deg;F</div>";
					html += "		<div class='col-xs-3' style='padding:0 0 0 10px;'> " + Math.round(maxt_c) + " &deg;C</div>";
					html += "	</div>";
				}
				if (mint_f != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(mint_f_valid), "dd mmm h:MM TT Z") + "'>Min Temp: </div>";
					html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(mint_f) + " &deg;F</div>";
					html += "		<div class='col-xs-3' style='padding:0 0 0 10px;'> " + Math.round(mint_c) + " &deg;C</div>";
					html += "	</div>";
				}
				if (max_relh != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(max_relh_valid), "dd mmm h:MM TT Z") + "'>Max RH: </div>";
					html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(max_relh) + " %</div>";
					html += "	</div>";
				}
				if (min_relh != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(min_relh_valid), "dd mmm h:MM TT Z") + "'>Min RH: </div>";
					html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(min_relh) + " %</div>";
					html += "	</div>";
				}
				if (max_gust != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(max_gust_valid), "dd mmm h:MM TT Z") + "'>Max Gust: </div>";
					html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(max_gust) + " mph</div>";
					html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(max_gust_kts) + " kts</div>";
					html += "	</div>";
				}
			}
			if(!obsHover) {
				html += "	<div class='row' style='border-top:1px solid #959595;margin-top:5px;padding-top:5px;'>";
				html += '		<div class="col-xs-12" style="padding:0px;text-align:center;"><b>Historical Observations:</b> <a href="/mesowest/timeseries.php?sid=' + stn_id + '&num=72&banner=gmap&raw=0&w=325" target="_blank"><b>3 Day</b></a>&nbsp;&nbsp;<a href="/mesowest/timeseries.php?sid=' + stn_id + '&num=168&banner=gmap&raw=0&w=325" target="_blank"><b>7 Day</b></a></div>';
				html += "	</div>";
			} else {
				html += "	<div class='row' style='border-top:1px solid #959595;margin-top:5px;padding-top:5px;'>";
				html += '		<div class="col-xs-12" style="padding:0px;text-align:center;color:#196fa6;font-weight:bold;">Click Station Icon For 3 Day History</div>';
				html += "	</div>";
			}

			// what parameter should be displayed
			if (obsType == "air_temp") {
				var passedFilters = checkFilters([temp_f, stn_elevation]);
				if (!isNaN(temp_f) && passedFilters) {
					var colorStyle = (obsType == "air_temp" || obsType == "hist_air_temp") ? calculateTempColor(temp_f, "F") : calculateTempColor(temp_f, "C");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(temp_f) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id};
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "dew_point") {
				var passedFilters = checkFilters([dew_f, stn_elevation]);
				if (!isNaN(dew_f) && passedFilters) {
					var colorStyle = (obsType == "dew_point" || obsType == "hist_dew_point") ? calculateTempColor(dew_f, "F") : calculateTempColor(dew_f, "C");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(dew_f) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id};
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "relative_humidity") {
				var passedFilters = checkFilters([relh, stn_elevation]);
				if (!isNaN(relh) && passedFilters) {
					var colorStyle = calculateRhColor(relh);
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(relh) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "wind_gust" || obsType == "wind_gust_kts") {
				var passedFilters = checkFilters([gust, stn_elevation]);

				if (!isNaN(gust) && passedFilters) {
					var colorStyle = (obsType == "wind_gust" || obsType == "hist_wind_gust") ? calculateWindColor(gust, "mph") : calculateWindColor(gust, "kts");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(gust) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "wind_chill") {
				var passedFilters = checkFilters([chill, stn_elevation]);

				if (!isNaN(chill) && passedFilters) {
					var colorStyle = calculateTempColor(chill, "F");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(chill) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "heat_index") {
				var passedFilters = checkFilters([hindex, stn_elevation]);

				if (!isNaN(hindex) && passedFilters) {
					var colorStyle = calculateTempColor(hindex, "F");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(hindex) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "visibility") {
				var passedFilters = checkFilters([stn_elevation]);
				if (!isNaN(vis) && passedFilters) {
					var colorStyle = calculateVisColor(vis, "mi");
					if(vis < 0) { vis = "< " + (vis * -1); }
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + vis + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "weather") {
				var passedFilters = checkFilters([temp_f, gust, relh, stn_elevation]);
				if (passedFilters) {
					var wxHtml = createStationPlot(temp_f, dew_f, wind_kts, wind_dir, slp, gust, relh, cld1, cld2, cld3);
					var wxIcon = L.divIcon({ className: 'wx-icon', html: wxHtml, iconSize: [40, 40] })
					var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
					if (obsHover) {
						wxMarker.on("mouseover", function(e) { this.openPopup(); })
						wxMarker.on("mouseout", function(e) { this.closePopup(); })
						wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
					}
					wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
					obsLayer.addLayer(wxMarker);
				}
			} else if (obsType == "firewx") {
				var passedFilters = checkFilters([winds, relh, stn_elevation]);

				if (passedFilters) {
					var fireHtml = createFireIcon(winds, relh); // "<div class='fire-left' style='background:yellow;'>W</div><div class='fire-right' style='background:green;'>H</div>";
					var wxIcon = L.divIcon({ className: 'wx-icon', html: fireHtml, iconSize: [40, 40] })
					var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
					if (obsHover) {
						wxMarker.on("mouseover", function(e) { this.openPopup(); })
						wxMarker.on("mouseout", function(e) { this.closePopup(); })
						wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
					}
					wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
					obsLayer.addLayer(wxMarker);
				}
			} else if (obsType == "air_temp_high_24_hour" || obsType == "air_temp_low_24_hour") {
				var mtemp = (obsType == "air_temp_high_24_hour") ? maxt_f : mint_f;
				var passedFilters = checkFilters([mtemp, stn_elevation]);

				if (passedFilters) {
					var colorStyle = calculateTempColor(mtemp, "F");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(mtemp) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "wind_gust_high_24_hour") {
				var passedFilters = checkFilters([max_gust, stn_elevation]);

				if (!isNaN(max_gust) && passedFilters) {
					var colorStyle = calculateWindColor(max_gust, "mph");
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(max_gust) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			} else if (obsType == "relative_humidity_high_24_hour" || obsType == "relative_humidity_low_24_hour") {
				var mrelh = (obsType == "relative_humidity_high_24_hour") ? max_relh : min_relh;
				var passedFilters = checkFilters([mrelh, stn_elevation]);

				if (!isNaN(mrelh) && passedFilters) {
					var colorStyle = calculateRhColor(mrelh);
					if (colorStyle) {
						var wxIcon = L.divIcon({ className: 'marker-icon', html: "<div class='text-marker' style='color:" + colorStyle.color + ";text-shadow:" + colorStyle.shadow + ";'>" + Math.round(mrelh) + "</div>" });
						var wxMarker = L.marker([stn_latitude, stn_longitude], { icon: wxIcon }).bindPopup(new L.responsivePopup({ autoPanPadding: [10,10] }).setContent(html), { autoPan: false });
						if (obsHover) {
							wxMarker.on("mouseover", function(e) { this.openPopup(); })
							wxMarker.on("mouseout", function(e) { this.closePopup(); })
							wxMarker.on("click", function(stn) { window.open("https://" + window.location.hostname + "/mesowest/timeseries.php?sid=" + stn.target.data.stid + "&num=72&banner=gmap&raw=0&w=325","_blank") });
						}
						wxMarker.data = { "stid": stn_id, "mnet": mnet_id };
						obsLayer.addLayer(wxMarker);
					}
				}
			}
		}

		obsDisplayed = true;

		// watch for map movement and refresh obs
		map.on("moveend", toggleObservations);

		// hide loading
		$("#load-div").hide();

		// update the layer timestamp
		createObsTimestamp(true);

		// enable auto-refresh
		obsAutoupdate(true);

		// legend
		viewObsLegend(true);

	} else {
		// show alerts and hide loading
		$("#numobs-alert").show();
		$("#load-div").hide();

		// watch for map movement and refresh obs
		map.on("moveend", toggleObservations);

		// update the layer timestamp
		createObsTimestamp(true);

		// enable auto-refresh
		obsAutoupdate(true);

		// legend
		viewObsLegend(true);
		obsDisplayed = true;

	}
}



function checkFilters(valArray) {
	var pass = true;
	if (obsType == "weather") {
		// weather [t,gust,rh,elev]
		if(tempFilterEnabled) { if(isNaN(valArray[0])) { pass = false; } else if(valArray[0] < tempFilter[0] || valArray[0] > tempFilter[1]) { pass = false; }}
		if(gustFilterEnabled) { if(isNaN(valArray[1])) { pass = false;}	else if(valArray[1] < gustFilter[0] || valArray[1] > gustFilter[1]) { pass = false; }}
		if(rhFilterEnabled) { if(isNaN(valArray[2])) { pass = false; } else if(valArray[2] < rhFilter[0] || valArray[2] > rhFilter[1]) { pass = false; }}
		if(elevFilterEnabled) { if(isNaN(valArray[3])) { pass = false; } else if(valArray[3] < elevFilter[0] || valArray[3] > elevFilter[1]) { pass = false; }}
	} else if (obsType == "precip") {
		// precip [precip,elev]
		if(precipFilterEnabled) { if(isNaN(valArray[0])) { pass = false; } else if(valArray[0] < precipFilter[0] || valArray[0] > precipFilter[1]) { pass = false; }}
		if(elevFilterEnabled) { if(isNaN(valArray[1])) { pass = false; } else if(valArray[1] < elevFilter[0] || valArray[1] > elevFilter[1]) { pass = false; }}
	} else if (obsType == "air_temp" || obsType == "air_temp_high_24_hour" || obsType == "air_temp_low_24_hour") {
		// temp [t,elev]
		if(tempFilterEnabled) { if(isNaN(valArray[0])) { pass = false; } else if(valArray[0] < tempFilter[0] || valArray[0] > tempFilter[1]) { pass = false; }}
		if(elevFilterEnabled) { if(isNaN(valArray[1])) { pass = false; } else if(valArray[1] < elevFilter[0] || valArray[1] > elevFilter[1]) { pass = false; }}
	} else if (obsType == "wind_gust" || obsType == "wind_gust_high_24_hour") {
		// gust [gust,elev]
		if(gustFilterEnabled) { if(isNaN(valArray[0])) { pass = false;}	else if(valArray[0] < gustFilter[0] || valArray[0] > gustFilter[1]) { pass = false; }}
		if(elevFilterEnabled) { if(isNaN(valArray[1])) { pass = false; } else if(valArray[1] < elevFilter[0] || valArray[1] > elevFilter[1]) { pass = false; }}
	} else if (obsType == "wind_chill") {
		// chill [chill,elev]
		if(tempFilterEnabled) { if(isNaN(valArray[0])) { pass = false; } else if(valArray[0] < tempFilter[0] || valArray[0] > tempFilter[1]) { pass = false; }}
		if(elevFilterEnabled) { if(isNaN(valArray[1])) { pass = false; } else if(valArray[1] < elevFilter[0] || valArray[1] > elevFilter[1]) { pass = false; }}
	} else if (obsType == "heat_index") {
		// chill [chill,elev]
		if(tempFilterEnabled) { if(isNaN(valArray[0])) { pass = false; } else if(valArray[0] < tempFilter[0] || valArray[0] > tempFilter[1]) { pass = false; }}
		if(elevFilterEnabled) { if(isNaN(valArray[1])) { pass = false; } else if(valArray[1] < elevFilter[0] || valArray[1] > elevFilter[1]) { pass = false; }}
	} else if (obsType == "dew_point" || obsType == "dew_pointc") {
		// dew [dew,elev]
		if(tempFilterEnabled) { if(isNaN(valArray[0])) { pass = false; } else if(valArray[0] < tempFilter[0] || valArray[0] > tempFilter[1]) { pass = false; }}
		if(elevFilterEnabled) { if(isNaN(valArray[1])) { pass = false; } else if(valArray[1] < elevFilter[0] || valArray[1] > elevFilter[1]) { pass = false; }}
	} else if (obsType == "firewx") {
		// firewx [temp, rh, elev]
		if(valArray[0] == "N/A" && valArray[1] == "N/A") {
			pass = false;
		}
		if(tempFilterEnabled) { if(isNaN(valArray[0])) { pass = false; } else if(valArray[0] < tempFilter[0] || valArray[0] > tempFilter[1]) { pass = false; }}
		if(rhFilterEnabled) { if(isNaN(valArray[1])) { pass = false; } else if(valArray[1] < rhFilter[0] || valArray[1] > rhFilter[1]) { pass = false; }}
		if(elevFilterEnabled) { if(isNaN(valArray[2])) { pass = false; } else if(valArray[2] < elevFilter[0] || valArray[2] > elevFilter[1]) { pass = false; }}
	} else if (obsType == "relative_humidity") {
		if(rhFilterEnabled) { if(isNaN(valArray[0])) { pass = false; } else if(valArray[0] < rhFilter[0] || valArray[0] > rhFilter[1]) { pass = false; }}
		if(elevFilterEnabled) { if(isNaN(valArray[1])) { pass = false; } else if(valArray[1] < elevFilter[0] || valArray[1] > elevFilter[1]) { pass = false; }}
	} else {
		if(elevFilterEnabled) { if(isNaN(valArray[0])) { pass = false; } else if(valArray[0] < elevFilter[0] || valArray[0] > elevFilter[1]) { pass = false; }}
	}
	return pass;
}

function filterObs() {
	if (obsDisplayed) {
		obsLayer.clearLayers();
		if(obsType.indexOf("change") >= 0) {
			parseChangeResult(json_data1,json_data2);
		} else if (obsType == "precip") {
			parsePrecipResult(json_data1);
		} else {
			if(obsTimeframe == "historical") {
				parseHistoricalResult(json_data1,json_data2);
			} else {
				parseLatestResult(json_data1);
			}
		}
	}
}


/**
 * Remove observations from the map
 */
function removeObservationLayer() {
	// remove all markers
	obsLayer.clearLayers();

	// don't need to watch for map movement
	map.off("moveend", toggleObservations);

	// remove autoupdate
	obsAutoupdate(false);

	observations = {};
	obsDisplayed = false;
}

function createStationPlot(temp, td, spd, dir, pres, gust, rh, c1, c2, c3) {
	var c1_val = "";
	var startAscii = 197; // starting ascii char for font
	var wspdKts = round5(spd); // wind speed kts rounded  to the nearest 5
	var wxChar = startAscii + Math.floor(wspdKts / 5) - 1;
	// console.log("Orig: " + spd + " Spd: " + wspdKts + " Char: " + wxChar);
	var windStr = String.fromCharCode(wxChar);
	var top = 0;
	var left = 0;
	var top = -17 + (-7 * Math.cos((dir * (Math.PI / 180))));
	var left = 6 * Math.sin((dir * (Math.PI / 180)));

	var stnPlot = "";
	stnPlot = "<div style='position:absolute;width:40px;height:40px;'>";
	if (!isNaN(temp) && $("#temp").is(":checked")) {
		stnPlot += "	<div class='temp'>" + Math.round(temp) + "</div>";
	}
	if (!isNaN(td) && $("#dew").is(":checked")) {
		stnPlot += "	<div class='dew'>" + Math.round(td) + "</div>";
	}
	if (!isNaN(rh) && $("#rh").is(":checked")) {
		stnPlot += " 	<div class='rh'>" + Math.round(rh) + "</div>";
	}
	if (!isNaN(gust) && $("#gust").is(":checked")) {
		stnPlot += "	<div class='gust'>" + Math.round(gust) + "</div>";
	}

	if (!isNaN(pres) && $("#slp").is(":checked")) {
		stnPlot += "	<div class='slp'>" + pres + "</div>";
	}

	if (!isNaN(spd) && !isNaN(dir) && $("#wind").is(":checked") && wxChar >= startAscii) {
		stnPlot += "	<div class='windbarb-container' style='width:25px;height:25px;'>";
		stnPlot += "		<div class='windbarb' style='top:" + top + "px;left:" + left + "px;transform:rotate(" + dir + "deg);font-weight:bold;'>" + windStr + "</div>";
		stnPlot += "	</div>";
	} else {
		stnPlot += "	<div class='wx-center'>+</div>";
	}
	stnPlot += "</div>";
	return stnPlot;
}

function round5(x) {
	return (x % 5 < 3) ? (x % 5 === 0 ? x : Math.floor(x / 5) * 5) : Math.ceil(x / 5) * 5;
}

function createFireIcon(w, h) {
	var wcat = 0;
	var hcat = 0;
	var html = "";

	var fireColors = {
		0: { "background": "None", "text": "black" },
		1: { "background": "green", "text": "white" },
		2: { "background": "yellow", "text": "black" },
		3: { "background": "red", "text": "black" },
		4: { "background": "maroon", "text": "white" }
	};

	// check wind
	if (w >= 35) { wcat = 3; } else if (w >= 25 && w < 35) { wcat = 2; } else if (w > 0 && w < 25) { wcat = 1; }

	// check rh
	if (h < 10) { hcat = 4; } else if (h >= 10 && h <= 15) { hcat = 3; } else if (h > 15 && h <= 20) { hcat = 2; } else if (h > 20) { hcat = 1; }

	if (wcat > 0) {
		html += "<div class='fire-left' style='background:" + fireColors[wcat].background + ";color:" + fireColors[wcat].text + ";'>W</div>";
	} else {
		html += "<div class='fire-left' style='color:" + fireColors[wcat].text + ";'>W</div>";
	}

	if (hcat > 0) {
		html += "<div class='fire-right' style='background:" + fireColors[hcat].background + ";color:" + fireColors[hcat].text + ";'>H</div>";
	} else {
		html += "<div class='fire-right' style='color:" + fireColors[hcat].text + ";'>H</div>";
	}
	return html;
}

function queryStation(ob) {
	$("#load-div").hide();

	var apiUrl = "https://api.synopticlabs.org/v2/stations/latest";
	var apiQuery = { token: mesoToken, units: "temp|F,speed|mph", stid: ob.layer.data.stid, status: "active" }
	var apiQueryStats = { token: mesoToken, units: "temp|F,speed|mph", stid: ob.layer.data.stid, status: "active" }
	if (obsTimeframe == "historical") {
		if (obsType == "precip") {
			apiQuery["attime"] = dateFormat(accumEndDatetime, "UTC:yyyymmddHHMM");
		} else {
			apiQuery["attime"] = dateFormat(historicalDatetime, "UTC:yyyymmddHHMM");
		}
		apiQuery["within"] = 90
		apiUrl = "https://api.synopticlabs.org/v2/stations/nearesttime"
	}

	var apiUrlNetwork = "https://api.synopticlabs.org/v2/networks";
	var apiQueryNetwork = { token: mesoToken, id: ob.layer.data.mnet };

	// configure query for stats
	var apiUrlStats = "https://api.synopticlabs.org/v2/stations/statistics";
	var apiQueryMax = { token: mesoToken, units: "temp|F,speed|mph", stid: ob.layer.data.stid, vars: "air_temp,wind_gust,relative_humidity", type: "max", status: "active" };
	var apiQueryMin = { token: mesoToken, units: "temp|F,speed|mph", stid: ob.layer.data.stid, vars: "air_temp,wind_gust,relative_humidity", type: "min", status: "active" };
	var endDate, startDate;
	if (obsTimeframe == "historical") {
		endDate = new Date(historicalDatetime);
		startDate = new Date(historicalDatetime);
		startDate.setHours(startDate.getHours() - 24);
		apiQueryMax["start"] = dateFormat(startDate, "UTC:yyyymmddHHMM");
		apiQueryMax["end"] = dateFormat(endDate, "UTC:yyyymmddHHMM");
		apiQueryMin["start"] = dateFormat(startDate, "UTC:yyyymmddHHMM");
		apiQueryMin["end"] = dateFormat(endDate, "UTC:yyyymmddHHMM");
	} else {
		endDate = new Date();
		startDate = new Date();
		startDate.setHours(startDate.getHours() - 24);
		apiQueryMax["start"] = dateFormat(startDate, "UTC:yyyymmddHHMM");
		apiQueryMax["end"] = dateFormat(endDate, "UTC:yyyymmddHHMM");
		apiQueryMin["start"] = dateFormat(startDate, "UTC:yyyymmddHHMM");
		apiQueryMin["end"] = dateFormat(endDate, "UTC:yyyymmddHHMM");
	}

	$.when($.ajax({ url: apiUrl, data: apiQuery, dataType: 'json' }), $.ajax({ url: apiUrlStats, data: apiQueryMax, dataType: 'json' }), $.ajax({ url: apiUrlStats, data: apiQueryMin, dataType: 'json' }), $.ajax({ url: apiUrlNetwork, data: apiQueryNetwork, dataType: 'json' })).done(function(jInfo, jMax, jMin, jNet) {
		// variables
		var stn, stnMax, stnMin, html, id, name, status, lat, lon, elev, update, temp_f, tempc, tempValid, dew_f, dewc, relh, winds, windkts, winddir, gust, gustkts, gustValid, chill, alt, vis, weather;
		var maxt_f, mint_f, maxt_fValid, mint_f_valid, mint_c, maxTC, minRH, maxRH, maxRHValid, minRHValid, maxGust, maxGustValid, water_temp_f, water_temp_c, wave_height, wave_period, prim_swell_hgt, prim_swell_per, prim_swell_dir, mnet;
		var roadTF, roadTC, roadStatus, precip_1_in, precip_3_in, precip_6_in, precip_12_in, precip_24_in, precip36in, precip72in;
		if (jInfo[1] == "success" && jInfo[0].STATION) {
			// get station metadata
			stn = jInfo[0].STATION[0];
			html = "";
			id = (stn.STID) ? stn.STID : "N/A";
			name = (stn.NAME) ? stn.NAME : "N/A";
			mnet = (stn.MNET_ID) ? stn.MNET_ID : "N/A";
			mnetName = (jNet[1] == "success" && jNet[0].MNET[0].SHORTNAME) ? jNet[0].MNET[0].SHORTNAME : "N/A";
			status = (stn.STATUS) ? stn.STATUS : "N/A";
			lat = (stn.LATITUDE) ? parseFloat(stn.LATITUDE).toFixed(2) : "N/A";
			lon = (stn.LONGITUDE) ? parseFloat(stn.LONGITUDE).toFixed(2) : "N/A";
			elev = (stn.ELEVATION) ? parseInt(stn.ELEVATION) : "N/A";
			update = (stn.OBSERVATIONS.air_temp_value_1) ? stn.OBSERVATIONS.air_temp_value_1.date_time : "N/A";

			// collect observation info
			if (stn.OBSERVATIONS) {
				temp_f = (stn.OBSERVATIONS.air_temp_value_1 && stn.OBSERVATIONS.air_temp_value_1.value) ? parseFloat(stn.OBSERVATIONS.air_temp_value_1.value) : "N/A";
				tempc = (temp_f != "N/A") ? (temp_f - 32) * (5 / 9) : "N/A";
				tempValid = (!isNaN(temp_f)) ? dateFormat(stn.OBSERVATIONS.air_temp_value_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
				dew_f = (stn.OBSERVATIONS.dew_point_temperature_value_1d && stn.OBSERVATIONS.dew_point_temperature_value_1d.value) ? parseFloat(stn.OBSERVATIONS.dew_point_temperature_value_1d.value) : "N/A";
				dewc = (dew_f != "N/A") ? (dew_f - 32) * (5 / 9) : "N/A";
				relh = (stn.OBSERVATIONS.relative_humidity_value_1 && stn.OBSERVATIONS.relative_humidity_value_1.value) ? Math.round(parseFloat(stn.OBSERVATIONS.relative_humidity_value_1.value)) : "N/A";
				winds = (stn.OBSERVATIONS.wind_speed_value_1 && stn.OBSERVATIONS.wind_speed_value_1.value) ? Math.round(parseFloat(stn.OBSERVATIONS.wind_speed_value_1.value)) : "N/A";
				windkts = (winds != "N/A") ? parseFloat(winds * 0.868976) : "N/A";
				wind_dir = (winds != "N/A" && stn.OBSERVATIONS.wind_direction_value_1 && stn.OBSERVATIONS.wind_direction_value_1.value) ? parseInt(stn.OBSERVATIONS.wind_direction_value_1.value) : "N/A";
				windDirCard = (winds != "N/A" && stn.OBSERVATIONS.wind_cardinal_direction_value_1d && stn.OBSERVATIONS.wind_cardinal_direction_value_1d.value) ? (stn.OBSERVATIONS.wind_cardinal_direction_value_1d.value).trim() : "N/A";
				gust = (stn.OBSERVATIONS.wind_gust_value_1 && stn.OBSERVATIONS.wind_gust_value_1.value) ? Math.round(parseFloat(stn.OBSERVATIONS.wind_gust_value_1.value)) : "N/A";
				gustkts = (gust != "N/A") ? parseFloat(gust * 0.868976) : "N/A";
				gustValid = (!isNaN(gust)) ? dateFormat(new Date(stn.OBSERVATIONS.wind_gust_value_1.date_time), "m/d/yyyy h:MM TT Z") : "N/A";
				chill = (stn.OBSERVATIONS.wind_chill_value_1 && stn.OBSERVATIONS.wind_chill_value_1.value) ? Math.round(parseFloat(stn.OBSERVATIONS.wind_chill_value_1.value)) : "N/A";
				alt = (stn.OBSERVATIONS.altimeter_value_1 && stn.OBSERVATIONS.altimeter_value_1.value) ? parseFloat(stn.OBSERVATIONS.altimeter_value_1.value * 0.0002953).toFixed(2) : "N/A";
				vis = (stn.OBSERVATIONS.visibility_value_1 && stn.OBSERVATIONS.visibility_value_1.value) ? parseFloat(stn.OBSERVATIONS.visibility_value_1.value).toFixed(2) : "N/A";
				weather = (stn.OBSERVATIONS.weather_condition_value_1 && stn.OBSERVATIONS.weather_condition_value_1.value) ? stn.OBSERVATIONS.weather_condition_value_1.value : "N/A";
				roadTF = (stn.OBSERVATIONS.road_temp_value_1 && stn.OBSERVATIONS.road_temp_value_1.value) ? parseFloat(stn.OBSERVATIONS.road_temp_value_1.value) : "N/A";
				roadTC = (roadTF != "N/A") ? (roadTF -32) * (5/9) : "N/A";
				maxt_f = (stn.OBSERVATIONS.air_temp_high_24_hour_value_1 && stn.OBSERVATIONS.air_temp_high_24_hour_value_1.value) ? Math.round(parseFloat(stn.OBSERVATIONS.air_temp_high_24_hour_value_1.value)) : "N/A";
				maxt_fValid = (stn.OBSERVATIONS.air_temp_high_24_hour_value_1 && stn.OBSERVATIONS.air_temp_high_24_hour_value_1.date_time) ? dateFormat(stn.OBSERVATIONS.air_temp_high_24_hour_value_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
				maxTC = (maxt_f != "N/A") ? (maxt_f - 32) * (5 / 9) : "N/A";
				mint_f = (stn.OBSERVATIONS.air_temp_low_24_hour_value_1 && stn.OBSERVATIONS.air_temp_low_24_hour_value_1.value) ? Math.round(parseFloat(stn.OBSERVATIONS.air_temp_low_24_hour_value_1.value)) : "N/A";
				mint_f_valid = (stn.OBSERVATIONS.air_temp_low_24_hour_value_1 && stn.OBSERVATIONS.air_temp_low_24_hour_value_1.date_time) ? dateFormat(stn.OBSERVATIONS.air_temp_low_24_hour_value_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
				mint_c = (mint_f != "N/A") ? (mint_f - 32) * (5 / 9) : "N/A";
				water_temp_f = (stn.OBSERVATIONS.T_water_temp_value_1 && stn.OBSERVATIONS.T_water_temp_value_1.value) ? parseFloat(stn.OBSERVATIONS.T_water_temp_value_1.value) : "N/A";
				water_temp_c = (water_temp_f != "N/A") ? (water_temp_f - 32) * (5/9) : "N/A";
				wave_height = (stn.OBSERVATIONS.wave_height_value_1 && stn.OBSERVATIONS.wave_height_value_1.value) ? parseFloat(stn.OBSERVATIONS.wave_height_value_1.value) : "N/A";
				wave_period = (stn.OBSERVATIONS.wave_period_value_1 && stn.OBSERVATIONS.wave_period_value_1.value) ? parseFloat(stn.OBSERVATIONS.wave_period_value_1.value) : "N/A";
				prim_swell_hgt = (stn.OBSERVATIONS.primary_swell_wave_height_value_1 && stn.OBSERVATIONS.primary_swell_wave_height_value_1.value) ? parseFloat(stn.OBSERVATIONS.primary_swell_wave_height_value_1.value) : "N/A";
				prim_swell_per = (stn.OBSERVATIONS.primary_swell_wave_period_value_1 && stn.OBSERVATIONS.primary_swell_wave_period_value_1.value) ? parseFloat(stn.OBSERVATIONS.primary_swell_wave_period_value_1.value) : "N/A";
				prim_swell_dir = (stn.OBSERVATIONS.primary_swell_true_direction_value_1 && stn.OBSERVATIONS.primary_swell_true_direction_value_1.value) ? stn.OBSERVATIONS.primary_swell_true_direction_value_1.value : "N/A";
				precip_1_in = (stn.OBSERVATIONS.precip_accum_one_hour_value_1 && stn.OBSERVATIONS.precip_accum_one_hour_value_1.value) ? parseFloat(stn.OBSERVATIONS.precip_accum_one_hour_value_1.value) : "N/A";
				precip_3_in = (stn.OBSERVATIONS.precip_accum_three_hour_value_1 && stn.OBSERVATIONS.precip_accum_three_hour_value_1.value) ? parseFloat(stn.OBSERVATIONS.precip_accum_three_hour_value_1.value) : "N/A";
				precip_6_in = (stn.OBSERVATIONS.precip_accum_six_hour_value_1 && stn.OBSERVATIONS.precip_accum_six_hour_value_1.value) ? parseFloat(stn.OBSERVATIONS.precip_accum_six_hour_value_1.value) : "N/A";
				precip_12_in = (stn.OBSERVATIONS.precip_accum_12_hour_value_1 && stn.OBSERVATIONS.precip_accum_12_hour_value_1.value) ? parseFloat(stn.OBSERVATIONS.precip_accum_12_hour_value_1.value) : "N/A";
				precip_24_in = (stn.OBSERVATIONS.precip_accum_24_hour_value_1 && stn.OBSERVATIONS.precip_accum_24_hour_value_1.value) ? parseFloat(stn.OBSERVATIONS.precip_accum_24_hour_value_1.value) : "N/A";
			}
		}
		if (jMax[1] == "success" && jMax[0].STATION && obsType != "precip") {
			stnMax = jMax[0].STATION[0];
			if (stnMax.STATISTICS) {
				if(mnet !== "1" || maxt_f == "N/A") {
					maxt_f = (stnMax.STATISTICS.air_temp_set_1 && stnMax.STATISTICS.air_temp_set_1.maximum) ? parseFloat(stnMax.STATISTICS.air_temp_set_1.maximum) : "N/A";
					maxTC = (maxt_f != "N/A") ? (maxt_f - 32) * (5 / 9) : "N/A";
					maxt_fValid = (stnMax.STATISTICS.air_temp_set_1 && stnMax.STATISTICS.air_temp_set_1.date_time) ? dateFormat(stnMax.STATISTICS.air_temp_set_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
				}
				maxRH = (stnMax.STATISTICS.relative_humidity_set_1 && stnMax.STATISTICS.relative_humidity_set_1.maximum) ? parseFloat(stnMax.STATISTICS.relative_humidity_set_1.maximum) : "N/A";
				maxRHValid = (stnMax.STATISTICS.relative_humidity_set_1 && stnMax.STATISTICS.relative_humidity_set_1.date_time) ? dateFormat(stnMax.STATISTICS.relative_humidity_set_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
				maxGust = (stnMax.STATISTICS.wind_gust_set_1 && stnMax.STATISTICS.wind_gust_set_1.maximum) ? parseFloat(stnMax.STATISTICS.wind_gust_set_1.maximum) : "N/A";
				maxGustKts = (maxGust != "N/A") ? maxGust * 0.868976 : "N/A";
				maxGustValid = (stnMax.STATISTICS.wind_gust_set_1 && stnMax.STATISTICS.wind_gust_set_1.date_time) ? dateFormat(stnMax.STATISTICS.wind_gust_set_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
			}
		}
		if (jMin[1] == "success" && jMin[0].STATION && obsType != "precip") {
			stnMin = jMin[0].STATION[0];
			if (stnMin.STATISTICS) {
				if(mnet !== "1" || mint_f == "N/A") {
					mint_f = (stnMin.STATISTICS.air_temp_set_1 && stnMin.STATISTICS.air_temp_set_1.minimum) ? parseFloat(stnMin.STATISTICS.air_temp_set_1.minimum) : "N/A";
					mint_c = (mint_f != "N/A") ? (mint_f - 32) * (5 / 9) : "N/A";
					mint_f_valid = (stnMin.STATISTICS.air_temp_set_1 && stnMin.STATISTICS.air_temp_set_1.date_time) ? dateFormat(stnMin.STATISTICS.air_temp_set_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
				}
				minRH = (stnMin.STATISTICS.relative_humidity_set_1 && stnMin.STATISTICS.relative_humidity_set_1.minimum) ? parseFloat(stnMin.STATISTICS.relative_humidity_set_1.minimum) : "N/A";
				minRHValid = (stnMin.STATISTICS.relative_humidity_set_1 && stnMin.STATISTICS.relative_humidity_set_1.date_time) ? dateFormat(stnMin.STATISTICS.relative_humidity_set_1.date_time, "m/d/yyyy h:MM TT Z") : "N/A";
			}
		}
		html += "<div style='min-width:225px;font-size:0.9em;margin-top:5px;font-family:'Avenir Next W00', 'Avenir Next', Avenir;'>";
		html += "	<div class='row' style='background:rgb(245,245,245);margin-top:20px;border:1px solid #959595;'>";
		html += "		<div class='col-xs-4' style='padding:1px 0px 1px 3px;'><font style='font-size:1.1em;font-weight:bold;'>" + id + "</font></div>";
		html += "		<div class='col-xs-8' style='padding:1px 3px 1px 0px;text-align:right;'> " + lat + "/" + lon + " @ " + elev + "ft." + "</div>";
		html += "	</div>";
		html += "	<div class='row' style='margin-top:5px;'>";
		html += "		<div class='col-xs-4' style='padding:0px;'>Name: </div>";
		html += "		<div class='col-xs-8' style='padding:0px;'> " + name + "</div>";
		html += "	</div>";
		if(mnetName != "N/A") {
			html += "	<div class='row'>";
			html += "		<div class='col-xs-4' style='padding:0px;'>Provider: </div>";
			html += "		<div class='col-xs-8' style='padding:0px;'> " + mnetName + "</div>";
			html += "	</div>";
		}
		if(update != "N/A") {
			html += "	<div class='row'>";
			html += "		<div class='col-xs-4' style='padding:0px;'>Valid: </div>";
			html += "		<div class='col-xs-8' style='padding:0px;'> " + (update !== "N/A") ? dateFormat(new Date(update), "dd mmm h:MM TT Z") : "N/A" + "</div>";
			html += "	</div>";
		}
		html += "<hr style='margin:3px 0px;border-top: 1px solid #000;width:100% !important;'>";
		if(obsType != "precip") {
			if (temp_f != "N/A") {

				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + tempValid + "'>Temp: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(temp_f) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(tempc) + " &deg;C</div>";
				html += "	</div>";
			}
			if (dew_f != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Dew Point: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(dew_f) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(dewc) + " &deg;C</div>";
				html += "	</div>";
			}
			if (relh != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Relh: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + relh + " %</div>";
				html += "	</div>";
			}
			if (winds != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wind Speed: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(winds) + " mph</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(windkts) + " kts</div>";
				html += "	</div>";
			}
			if (wind_dir != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wind Dir: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + windDirCard + "</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + wind_dir + "&deg;</div>";
				html += "	</div>";
			}
			if (gust != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + gustValid + "'>Gust: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(gust) + " mph</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(gustkts) + " kts</div>";
				html += "	</div>";
			}
			if (chill != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wind Chill: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + chill + " &deg;F</div>";
				html += "	</div>";
			}
			if (alt != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Altimeter: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + alt + " in</div>";
				html += "	</div>";
			}
			if (vis != "N/A") {
				if(vis < 0) { vis = "< " + (vis * -1); }
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Visibility: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + vis + " mi</div>";
				html += "	</div>";
			}
			if (weather != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Weather: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + weather + "</div>";
				html += "	</div>";
			}
			if(roadTF != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Road Temp: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(roadTF) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(roadTC) + " &deg;C</div>";
				html += "	</div>";
			}
			if(water_temp_f != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Water Temp: </div>";
				html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(water_temp_f) + " &deg;F</div>";
				html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(water_temp_c) + " &deg;C</div>";
				html += "	</div>";
			}
			if(wave_height != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wave Height: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + wave_height + " ft</div>";
				html += "	</div>";
			}
			if(wave_period != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Wave Period: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + wave_period + " sec</div>";
				html += "	</div>";
			}
			if(prim_swell_hgt != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prim Swell Hgt: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + prim_swell_hgt + " ft</div>";
				html += "	</div>";
			}
			if(prim_swell_per != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prim Swell Per: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + prim_swell_per + " sec</div>";
				html += "	</div>";
			}
			if(prim_swell_dir != "N/A") {
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Prim Swell Dir: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'> " + prim_swell_dir + "&deg;</div>";
				html += "	</div>";
			}
			if (obsType == "precip" && obsTimeframe == "historical") {
				html += "	<div class='row' style='background:rgb(245,245,245);border:1px solid #959595;margin-top:5px;'>";
				html += "		<div class='col-xs-12' style='padding:1px 0px 1px 3px;'><font style='font-weight:bold;'>Precipitation Accumulation Valid</font></div>";
				html += "	</div>";
				html += "	<div class='row' style='margin-top:5px;'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Total: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'>" + ob.layer.data.amount + " in.</div>";
				html += "	</div>";
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Starting: </div>";
				html += "		<div class='col-xs-7' style='padding:0px;'>" + ob.layer.data.startTime + "</div>";
				html += "	</div>";
				html += "	<div class='row'>";
				html += "		<div class='col-xs-5' style='padding:0px;'>Ending:</div>";
				html += "		<div class='col-xs-7' style='padding:0px;'>" + ob.layer.data.endTime + "</div>";
				html += "	</div>";
			}
			if ((maxt_f != "N/A" || mint_f != "N/A" || maxRH != "N/A" || minRH != "N/A" || maxGust != "N/A") && obsType != "hist_precip") {
				html += "	<div class='row' style='background:rgb(245,245,245);border:1px solid #959595;margin-top:5px;'>";
				html += "		<div class='col-xs-5' style='padding:1px 0px 1px 3px;'><font style='font-weight:bold;'>24 Hour</font></div>";
				html += "		<div class='col-xs-7' style='padding:1px 0px;'><font style='font-weight:bold;'>Highs & Lows</font></div>";
				html += "	</div>";
				if (maxt_f != "N/A") {
					html += "	<div class='row' style='margin-top:5px;'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(maxt_fValid), "dd mmm h:MM TT Z") + "'>Max Temp: </div>";
					html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(maxt_f) + " &deg;F</div>";
					html += "		<div class='col-xs-3' style='padding:0 0 0 10px;'> " + Math.round(maxTC) + " &deg;C</div>";
					html += "	</div>";
				}
				if (mint_f != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(mint_f_valid), "dd mmm h:MM TT Z") + "'>Min Temp: </div>";
					html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(mint_f) + " &deg;F</div>";
					html += "		<div class='col-xs-3' style='padding:0 0 0 10px;'> " + Math.round(mint_c) + " &deg;C</div>";
					html += "	</div>";
				}
				if (maxRH != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(maxRHValid), "dd mmm h:MM TT Z") + "'>Max RH: </div>";
					html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(maxRH) + " %</div>";
					html += "	</div>";
				}
				if (minRH != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(minRHValid), "dd mmm h:MM TT Z") + "'>Min RH: </div>";
					html += "		<div class='col-xs-7' style='padding:0px;'> " + Math.round(minRH) + " %</div>";
					html += "	</div>";
				}
				if (maxGust != "N/A") {
					html += "	<div class='row'>";
					html += "		<div class='col-xs-5' style='padding:0px;' title='Valid: " + dateFormat(new Date(maxGustValid), "dd mmm h:MM TT Z") + "'>Max Gust: </div>";
					html += "		<div class='col-xs-4' style='padding:0px;'> " + Math.round(maxGust) + " mph</div>";
					html += "		<div class='col-xs-3' style='padding:0px;'> " + Math.round(maxGustKts) + " kts</div>";
					html += "	</div>";
				}
			}
		} else {
			// if(precip_1_in !== "N/A") {
			// 	html += "	<div class='row'>";
			// 	html += "		<div class='col-xs-5' style='padding:0px;'>1 Hour Precip: </div>";
			// 	html += "		<div class='col-xs-4' style='padding:0px;'> " + precip_1_in.toFixed(2) + " in</div>";
			// 	html += "		<div class='col-xs-3' style='padding:0px;'> " + (precip_1_in * 25.4).toFixed(2) + " mm</div>";
			// 	html += "	</div>";
			// }
			// if(precip_3_in !== "N/A") {
			// 	html += "	<div class='row'>";
			// 	html += "		<div class='col-xs-5' style='padding:0px;'>3 Hour Precip: </div>";
			// 	html += "		<div class='col-xs-4' style='padding:0px;'> " + precip_3_in.toFixed(2) + " in</div>";
			// 	html += "		<div class='col-xs-3' style='padding:0px;'> " + (precip_3_in * 25.4).toFixed(2) + " mm</div>";
			// 	html += "	</div>";
			// }
			// if(precip_6_in !== "N/A") {
			// 	html += "	<div class='row'>";
			// 	html += "		<div class='col-xs-5' style='padding:0px;'>6 Hour Precip: </div>";
			// 	html += "		<div class='col-xs-4' style='padding:0px;'> " + precip_6_in.toFixed(2) + " in</div>";
			// 	html += "		<div class='col-xs-3' style='padding:0px;'> " + (precip_6_in * 25.4).toFixed(2) + " mm</div>";
			// 	html += "	</div>";
			// }
			// if(precip_12_in !== "N/A") {
			// 	html += "	<div class='row'>";
			// 	html += "		<div class='col-xs-5' style='padding:0px;'>12 Hour Precip: </div>";
			// 	html += "		<div class='col-xs-4' style='padding:0px;'> " + precip_12_in.toFixed(2) + " in</div>";
			// 	html += "		<div class='col-xs-3' style='padding:0px;'> " + (precip_12_in * 25.4).toFixed(2) + " mm</div>";
			// 	html += "	</div>";
			// }
			// if(precip_24_in !== "N/A") {
			// 	html += "	<div class='row'>";
			// 	html += "		<div class='col-xs-5' style='padding:0px;'>24 Hour Precip: </div>";
			// 	html += "		<div class='col-xs-4' style='padding:0px;'> " + precip_24_in.toFixed(2) + " in</div>";
			// 	html += "		<div class='col-xs-3' style='padding:0px;'> " + (precip_24_in * 25.4).toFixed(2) + " mm</div>";
			// 	html += "	</div>";
			// }
			html += "	<div class='row' style='background:rgb(245,245,245);border:1px solid #959595;margin-top:5px;'>";
			html += "		<div class='col-xs-12' style='padding:1px 0px 1px 3px;'><font style='font-weight:bold;'>Precipitation Accumulation Valid</font></div>";
			html += "	</div>";
			html += "	<div class='row' style='margin-top:5px;'>";
			html += "		<div class='col-xs-5' style='padding:0px;'>Total: </div>";
			html += "		<div class='col-xs-7' style='padding:0px;'>" + ob.layer.data.amount + " in.</div>";
			html += "	</div>";
			html += "	<div class='row'>";
			html += "		<div class='col-xs-5' style='padding:0px;'>Starting: </div>";
			html += "		<div class='col-xs-7' style='padding:0px;'>" + ob.layer.data.startTime + "</div>";
			html += "	</div>";
			html += "	<div class='row'>";
			html += "		<div class='col-xs-5' style='padding:0px;'>Ending:</div>";
			html += "		<div class='col-xs-7' style='padding:0px;'>" + ob.layer.data.endTime + "</div>";
			html += "	</div>";
		}
		if (obsTimeframe !== "historical") {
			html += "	<div class='row' style='border-top:1px solid #959595;margin-top:5px;padding-top:5px;'>";
			// html += '		<div class="col-xs-12" style="padding:0px;text-align:center;"><b>Historical Observations:</b> <a href="#" onclick="javascript:showObTimeseries(\'' + id + '\', 72);"><b>3 Day</b></a>&nbsp;&nbsp;<a href="#" onclick="javascript:showObTimeseries(\'' + id + '\', 168);"><b>7 Day</b></a></div>';
			html += '		<div class="col-xs-12" style="padding:0px;text-align:center;"><b>Historical Observations:</b> <a href="/mesowest/timeseries.php?sid=' + id + '&num=72&banner=gmap&raw=0&w=325" target="_blank"><b>3 Day</b></a>&nbsp;&nbsp;<a href="/mesowest/timeseries.php?sid=' + id + '&num=168&banner=gmap&raw=0&w=325" target="_blank"><b>7 Day</b></a></div>';
			html += "	</div>";
		}
		html += "</div>";
		L.popup().setLatLng(ob.latlng).setContent(html).openOn(map);
		$("#load-div").hide();
	});
}

/**
 * Select new obs mesonet
 *
 * @param {String} net New desired network
 */
function selectObsNetwork(net) {
	networkSelected = net;

	if (obsDisplayed) {
		toggleObservations();
	}
}

function changeWeatherDisplayOptions() {
	if (obsDisplayed) {
		toggleObservations();
	}
}


function setObsDensity(d) {
	obsDensity = parseInt(d);
	if(obsDisplayed) {
		toggleObservations();
	}
}

function changeObsHover(chk) {
	if (chk) {
		obsHover = true;
	} else {
		obsHover = false;
	}
	if(obsDisplayed) {
		toggleObservations();
	}
}

/**
 * Change between latest and historical
 *
 * @param {String} tf example: latest or historical
 */
function changeObservationTimeframe(tf) {
	obsTimeframe = tf;

	if(obsTimeframe == "historical") {
		// $("#obs-type").css("border","2px solid orange");
		// $("#obs-historical").css("border","2px solid orange");
		$("#historical-label").show()
		$("#headingObs").css("background-color","#ffa366")
		$("#headingObs").css("color","#000")
		$("#headingObs").css("border","1px solid #000")
	} else {
		// $("#obs-type").css("border","1px solid #959595");
		// $("#obs-historical").css("border","1px solid #959595");
		$("#historical-label").hide()
		$("#headingObs").css("background-color","#196fa6")
		$("#headingObs").css("color","#fff")
		$("#headingObs").css("border","0px solid #196fa6")
	}

	var histval = $("#obs-type").val();
	checkZoom();
	changeObservationType(histval);
}

/**
 * Change observation type
 *
 * @param {String} typ example: weather, precip, etc..
 */
function changeObservationType(typ) {
	obsType = typ;
	var foundIssue = false;
	if (obsType == "weather") {
		$("#obs-precip-table").hide();
		$("#historical-precip-table").hide();
		$("#obs-wx-table").show();
		if (obsTimeframe == "historical") {
			$("#historical-obs-table").show();
		} else {
			$("#historical-obs-table").hide();
		}
		// filters
		$("#precip-row").hide();
		$("#gust-row").show();
		$("#temp-row").show();
		$("#elev-row").show();
		$("#rh-row").show();
	} else if(obsType.indexOf("change") >= 0) {
		 // hide precip stuff
		 $("#obs-wx-table").hide();
		 $("#obs-precip-table").hide();
		 $("#historical-precip-table").hide();
		 if (obsTimeframe == "historical") {
			 $("#historical-obs-table").show();
		 } else {
			 $("#historical-obs-table").hide();
		 }

		 // hide other vars
		 $("#gust-row").hide();
		 $("#elev-row").show();
		 $("#rh-row").hide();
		 $("#precip-row").hide();
		 $("#temp-row").hide();
	} else if (obsType == "precip") {
		if (obsTimeframe == "latest") {
			$("#obs-precip-table").show();
			$("#historical-precip-table").hide();
			$("#historical-obs-table").hide();
			$("#obs-wx-table").hide();

			// filters
			$("#precip-row").show();
			$("#gust-row").hide();
			$("#temp-row").hide();
			$("#elev-row").show();
			$("#rh-row").hide();
		} else {
			$("#obs-precip-table").hide();
			$("#historical-precip-table").show();
			$("#historical-obs-table").hide();
			$("#obs-wx-table").hide();

			// filters
			$("#precip-row").show();
			$("#gust-row").hide();
			$("#temp-row").hide();
			$("#elev-row").show();
			$("#rh-row").hide();
		}
	} else if(obsType == "air_temp_high_24_hour" || obsType == "air_temp_low_24_hour") {
		// hide precip stuff
		$("#obs-wx-table").hide();
		$("#obs-precip-table").hide();
		$("#historical-precip-table").hide();

		if(obsTimeframe == "historical") {
			$("#historical-obs-table").show();
		} else {
			$("#historical-obs-table").hide();
		}

		// hide other vars
		$("#gust-row").hide();
		$("#elev-row").show();
		$("#rh-row").hide();
		$("#precip-row").hide();
		$("#temp-row").show();
	} else if (obsType == "air_temp") {
		// hide precip stuff
		$("#obs-wx-table").hide();
		$("#obs-precip-table").hide();
		$("#historical-precip-table").hide();
		if (obsTimeframe == "historical") {
			$("#historical-obs-table").show();
		} else {
			$("#historical-obs-table").hide();
		}

		// hide other vars
		$("#gust-row").hide();
		$("#elev-row").show();
		$("#rh-row").hide();
		$("#precip-row").hide();
		$("#temp-row").show();
	} else if (obsType == "visibility") {
		// hide precip stuff
		$("#obs-wx-table").hide();
		$("#obs-precip-table").hide();
		$("#historical-precip-table").hide();
		if (obsTimeframe == "historical") {
			$("#historical-obs-table").show();
		} else {
			$("#historical-obs-table").hide();
		}

		// hide other vars
		$("#gust-row").hide();
		$("#elev-row").show();
		$("#rh-row").hide();
		$("#precip-row").hide();
		$("#temp-row").hide();
	} else if (obsType == "firewx" || obsType == "hist_firewx") {
		// hide precip stuff
		$("#obs-wx-table").hide();
		$("#obs-precip-table").hide();
		$("#historical-precip-table").hide();
		if (obsTimeframe == "historical") {
			$("#historical-obs-table").show();
		} else {
			$("#historical-obs-table").hide();
		}

		// hide other vars
		$("#gust-row").hide();
		$("#elev-row").show();
		$("#rh-row").show();
		$("#precip-row").hide();
		$("#temp-row").hide();
	} else if (obsType == "wind_chill" || obsType == "hist_wind_chill") {
		// hide precip stuff
		$("#obs-wx-table").hide();
		$("#obs-precip-table").hide();
		$("#historical-precip-table").hide();
		if (obsTimeframe == "historical") {
			$("#historical-obs-table").show();
		} else {
			$("#historical-obs-table").hide();
		}

		// hide other vars
		$("#gust-row").hide();
		$("#elev-row").show();
		$("#rh-row").hide();
		$("#precip-row").hide();
		$("#temp-row").show();
	} else if (obsType == "wind_gust" || obsType == "wind_gust_kts" || obsType == "hist_wind_gust" || obsType == "hist_wind_gust_kts" || obsType == "wind_gust_high_24_hour" || obsType == "hist_wind_gust_high_24_hour") {
		// hide precip stuff
		$("#obs-wx-table").hide();
		$("#obs-precip-table").hide();
		$("#historical-precip-table").hide();
		if (obsTimeframe == "historical") {
			$("#historical-obs-table").show();
		} else {
			$("#historical-obs-table").hide();
		}

		// hide other vars
		$("#gust-row").show();
		$("#elev-row").show();
		$("#rh-row").hide();
		$("#precip-row").hide();
		$("#temp-row").hide();
	} else if (obsType == "dew_point" || obsType == "dew_pointc" || obsType == "hist_dew_point" | obsType == "hist_dew_pointc") {
		// hide precip stuff
		$("#obs-wx-table").hide();
		$("#obs-precip-table").hide();
		$("#historical-precip-table").hide();
		if (obsTimeframe == "historical") {
			$("#historical-obs-table").show();
		} else {
			$("#historical-obs-table").hide();
		}

		// hide other vars
		$("#gust-row").hide();
		$("#elev-row").show();
		$("#rh-row").hide();
		$("#precip-row").hide();
		$("#temp-row").show();
	} else if (obsType == "relative_humidity" || obsType == "relative_humidity_high_24_hour" || obsType == "relative_humidity_low_24_hour") {
		// hide precip stuff
		$("#obs-wx-table").hide();
		$("#obs-precip-table").hide();
		$("#historical-precip-table").hide();
		if (obsTimeframe == "historical") {
			$("#historical-obs-table").show();
		} else {
			$("#historical-obs-table").hide();
		}

		// hide other vars
		$("#gust-row").hide();
		$("#elev-row").show();
		$("#rh-row").show();
		$("#precip-row").hide();
		$("#temp-row").hide();
	}

	if (obsDisplayed) {
		toggleObservations();
	}
}

/**
 * Set precipitatation accumulation period
 *
 * @param {Integer} period
 */
function setAccumulationPeriod(period) {
	accumulationPeriod = parseInt(period);
	if (accumulationPeriod > 72) {
		$("#historical-precip-table").show();
	} else {
		$("#historical-precip-table").hide();
	}
	if (obsDisplayed) {
		toggleObservations(true);
	}
}

function showObTimeseries(id, num) {
	$("#timeseries-content").empty();
	$("#timeseries-title").empty();
	var h = $(document).height() - 250;
	var html = "<iframe id='timeseries-frame' src='/mesowest/timeseries.php?sid=" + id + "&num=" + num + "&banner=gmap&raw=0&w=325' width='100%' height='" + h + "px' style='overflow:hidden;border:0px;'></iframe>";
	$("#timeseries-title").html("Observations for " + id + " <font style='font-size:0.8em;'>(Data provided by <b><a href='https://mesowest.utah.edu/' target='_blank'>MesoWest</a></b>)");
	$("#timeseries-content").html(html);
	$("#timeseries-dialog").modal('show');
}

function createObsTimestamp(bool) {
	var updateTime = new Date();
	if (bool) {
		$("#obs-timestamp").html("Updated: " + dateFormat(updateTime, "ddd mmm d, yyyy h:MM TT Z"));
		$("#obs-legend-timestamp").html("Updated: " + dateFormat(updateTime, "ddd mmm d, yyyy h:MM TT Z"));
	} else {
		$("#obs-timestamp").html("Layer Not Loaded");
		$("#obs-legend-timestamp").html("Updated: " + dateFormat(updateTime, "ddd mmm d, yyyy h:MM TT Z"));
	}
}

function viewObsLegend(bool) {
	if(bool) {
		$("#obs-legend-body").empty();
		if(obsType == "firewx") {
			var legendHtml =    '<table style="width:100%;font-size:0.8em;">';
			legendHtml +=       '   <thead><tr><th colspan="2">Wind(ASOS)</th><th colspan="2">Wind(RAWS)</th><th colspan="2">Wind Gust</th><th colspan="2">RH</th></tr></thead>';
			legendHtml +=       '   <tbody>';
			legendHtml +=       '       <tr>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:green;border:1px solid black"></div></td><td>< 20 mph</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:green;border:1px solid black"></div></td><td>< 15 mph</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:green;border:1px solid black"></div></td><td>< 25 mph</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:green;border:1px solid black"></div></td><td>> 25 %</td>';
			legendHtml +=       '       </tr>';
			legendHtml +=       '       <tr>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:yellow;border:1px solid black"></div></td><td>20-24 mph</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:yellow;border:1px solid black"></div></td><td>15-19 mph</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:yellow;border:1px solid black"></div></td><td>25-34 mph</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:yellow;border:1px solid black"></div></td><td>16-20 %</td>';
			legendHtml +=       '       </tr>';
			legendHtml +=       '       <tr>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:red;border:1px solid black"></div></td><td>>= 25 mph</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:red;border:1px solid black"></div></td><td>>= 20 mph</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:red;border:1px solid black"></div></td><td>>= 35 mph</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:red;border:1px solid black"></div></td><td>10-15 %</td>';
			legendHtml +=       '       </tr>';
			legendHtml +=       '       <tr>';
			legendHtml +=		'			<td>&nbsp;</td><td>&nbsp;</td>';
			legendHtml +=		'			<td>&nbsp;</td><td>&nbsp;</td>';
			legendHtml +=		'			<td>&nbsp;</td><td>&nbsp;</td>';
			legendHtml +=		'			<td><div style="display:inline-block;width:7px;height:7px;border-radius:50%;background:firebrick;border:1px solid black"></div></td><td>< 10 %</td>';
			legendHtml +=       '       </tr>';
			legendHtml +=       '   </tbody>';
			legendHtml +=       '</table>';
			$("#obs-legend-body").html(legendHtml);
			$("#obs-legend-body").show();
		}
	} else {
		$("#obs-legend-body").empty();
		$("#obs-legend-body").hide();
	}
}

/**
 * Control the autoupdating of layer
 *
 * @param {Boolean} bool Should be autoupdate layer
 */
function obsAutoupdate(bool) {
	if (bool) {
		obsInterval = setInterval(toggleObservations, 900000);
		$("#obs-refresh-notice").show();
	} else {
		clearInterval(obsInterval);
		$("#obs-refresh-notice").hide();
	}
}

function checkLongitude(long) {
	var newLong = long;
	if(long < 0 && long < -180) {
		deltaDegree = long - (-180);
		newLong =  180 + deltaDegree;
	}
	if(long > 0 && long > 180) {
		deltaDegree = long - 180;
		newLong = -180 + deltaDegree;
	}
	return newLong;
}