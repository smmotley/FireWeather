import * as location_map from '../map.js'
import * as addMarkers from '../util/addMarkers.js'

var mb_geocoder
var geocoder_result = null  // initialize with null
var geolocate  = new mapboxgl.GeolocateControl({
                        positionOptions: {
                            enableHighAccuracy: true
                        },
                        trackUserLocation: true
                    });

function createGeoLocationMap(onLoad, mapboxgl = window.mapboxgl) {
    mapboxgl.accessToken = JSON.parse(document.getElementById('mb_tkn').textContent);
    document.getElementById ("geolocate_user").addEventListener ("click",
        () => {geolocate_user()},
        false)
    //document.getElementById ("add_point").addEventListener ("click", addLocation, false);

    let map = new mapboxgl.Map({
        container: 'map_geolocation',
        style: 'mapbox://styles/mapbox/streets-v10',
        center: [-120.5, 39.05],
        zoom: 9
    });

    map.addControl(geolocate);
    //addMarkers.userMarkers(map)

    mb_geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        countries: 'us',
        region: 'california',
        marker: false
        });


   //mb_geocoder.addTo('#geolocation_searchbar');   //This will add the geocoder to the "Your Locations" tab
    map.addControl(mb_geocoder)


    mb_geocoder.on('result', function(ev) {
          geocoder_result = ev.result;
          console.log(geocoder_result)
          var styleSpecBox = document.getElementById('json-response');
          var styleSpecText = JSON.stringify(geocoder_result, null, 2);
          document.getElementById("add_point").style.visibility="visible"
          addMarkers.userMarkers(map, ev.result)
        });

    map.on('load', () =>
        addMarkers.userMarkers(map)
    )


}

createGeoLocationMap()

function geolocate_user(){
    document.getElementById("progress_container").style.display = 'block';
    var el = document.getElementById("change_location_tabs")
    var map_tabs = M.Tabs.getInstance(el);
    map_tabs.select('map_tab')
    console.log("GEOLOCATING")
    geolocate.trigger();
}

geolocate.on('geolocate', function(e) {
    let new_form_data = user_profile[0].fields
    console.log(user_profile)
    if (e.coords){
        var lng = e.coords.longitude;
        var lat = e.coords.latitude;
        new_form_data["user_lat"] = lat
        new_form_data["user_lng"] = lng
        new_form_data["user_desc"] = "Current Location"
        new_form_data['csrfmiddlewaretoken']=$('input[name=csrfmiddlewaretoken]').val(),
        new_form_data['action'] = 'post'
        try{
            new_form_data["user_radius"] = document.getElementById('user_radius').value;
        }
        catch(e){
            console.log(e, "No radius issued with geocoder result, using default val instead")
        }
    }


    $.ajax({
        type:'POST',
        url:'change_location',
        data: new_form_data,
        success:function(json) {
            document.getElementById("progress_container").style.display = 'none';
            document.getElementById('user_lat').value = lat
            document.getElementById('user_lng').value = lng
            console.log("USER LAT LNG SAVED")
        },
        error : function(xhr,errmsg,err) {
        console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });
});

var locs = ['user','fav1','fav2']
for (var i = 0; i < locs.length; i++){
    var loc = locs[i]
    document.getElementById(loc+"-edit-location-icon")
                .addEventListener("click", function (ev) {
                    var loc = ev.target.id.split("-")[0]
                    $('input[id='+loc+'_desc]')
                        .attr("type","form");
                    $('input[id='+loc+'_lat]')
                        .attr("type","form");
                    $('input[id='+loc+'_lng]')
                        .attr("type","form");
                    $('input[id='+loc+'_radius]')
                        .attr("type","form");
                    $('input[id='+loc+'_alert]')
                        .attr("type","form");
                    $('#location_form_buttons').show()
            })
}



