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
    document.getElementById ("geolocate_user").addEventListener ("click", geolocate_user, false);
    document.getElementById ("add_point").addEventListener ("click", addLocation, false);

    let map = new mapboxgl.Map({
        container: 'map_geolocation',
        style: 'mapbox://styles/mapbox/streets-v10',
        center: [-120.5, 39.05],
        zoom: 9
    });


    // Add the control to the map.
    map.addControl(geolocate);
    //addMarkers.userMarkers(map)

    mb_geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        countries: 'us',
        region: 'california',
        });


   //mb_geocoder.addTo('#geolocation_searchbar');   //This will add the geocoder to the "Your Locations" tab
    map.addControl(mb_geocoder)

    mb_geocoder.on('result', function(ev) {
          geocoder_result = ev.result;
          var styleSpecBox = document.getElementById('json-response');
          var styleSpecText = JSON.stringify(geocoder_result, null, 2);
          document.getElementById("add_point").style.visibility="visible"
        console.log(ev)
        var marker = new mapboxgl.Marker({
                draggable: true
            }).setLngLat(ev.result.center).addTo(map)
        //addMarkers.userMarkers(map)
        });

}

function add_user_markers(location_data){
        // create the popup
    var popup = new mapboxgl.Popup({ offset: 25 }).setText(
        'Description: ' + location_data
    );

// create DOM element for the marker
var el = document.createElement('div');
el.id = 'marker';

// create the marker
new mapboxgl.Marker(el)
    .setLngLat(monument)
    .setPopup(popup) // sets a popup on this marker
    .addTo(map);
}

function geolocate_user(){
    document.getElementById("progress_container").style.display = 'block';
    var el = document.getElementById("change_location_tabs")
    var map_tabs = M.Tabs.getInstance(el);
    map_tabs.select('map_tab')
    geolocate.trigger();
}

geolocate.on('geolocate', function(e) {
    var lng = e.coords.longitude;
    var lat = e.coords.latitude;
    var radius = document.getElementById('fav0_radius').value;
    let new_form_data = user_profile[0].fields
    new_form_data["user_lat"] = lat
    new_form_data["user_lng"] = lng
    new_form_data["user_radius"] = 50
    new_form_data["user_desc"] = 'Current Location'
    new_form_data['csrfmiddlewaretoken']=$('input[name=csrfmiddlewaretoken]').val(),
    new_form_data['action'] = 'post'

    $.ajax({
        type:'POST',
        url:'change_location',
        data: new_form_data,
        success:function(json) {
            document.getElementById("progress_container").style.display = 'none';
            document.getElementById('fav0_lat').value = lat
            document.getElementById('fav0_lng').value = lng
            console.log("USER LAT LNG SAVED")
        },
        error : function(xhr,errmsg,err) {
        console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });
});

function addLocation() {
    /* Only two locations can be added by the user. The geojson is created in the view by looking
    in the database for non-null values in user_lat, fav1_lat, fav2_lat. If any of these are null, they are not
    added to the geojson. Therefore, the existence of both fav1 and fav2 means two favorites have already been saved.
     */
    console.log("ADDING LOCATION")
    document.getElementById("progress_container").style.display = 'block';
    let pt = "fav1"             // Start under the assumption that this is for the first saved point.
    let pt1_full = false        // Holder for whether saved pt1 is full (pt1 could be empty when pt2 is full).
    console.log(location_data)
    for (var [key,val] of Object.entries(location_data.features)){
        // Test if pt1 is occupied with a value. It will be occupied if an id exists with "pt1".
        if (val.properties.id == "fav1"){
            pt = "fav2"         // Since there is a val for "fav1", change to "fav2".
            pt1_full = true     // Let the holder know that "fav1" has a value (this is in case fav2 exists, but fav1 is empty)
        }
        // Test if fav2 is occupied with a value AND fav1 has a value.
        // If fav2 is full and fav1 is full, then alert the user that they need to delete on of their saved locations.
        if (val.properties.id == "fav2" && pt1_full) {
            const elem = document.getElementById('location_modal');
            const instance = M.Modal.init(elem, {dismissible: false});
            instance.open()
            return
        }
    }

    //The only way to get dynamic variables into an ajax call is to build the object this way:
    let new_form_data = user_profile[0].fields
    if (geocoder_result){
        new_form_data[pt+"_lat"] = geocoder_result.geometry.coordinates[1]
        new_form_data[pt+"_lng"] = geocoder_result.geometry.coordinates[0]
        new_form_data[pt+'_radius'] = 50
        new_form_data[pt+"_desc"] = geocoder_result.text
    }

    new_form_data['csrfmiddlewaretoken'] = $('input[name=csrfmiddlewaretoken]').val()
    new_form_data['action'] = 'post'
    console.log(new_form_data)

    $.ajax({
        type: 'POST',
        url: 'change_location',
        data: new_form_data,
        success: function (json) {
            document.getElementById("progress_container").style.display = 'none';
            document.getElementById("add_point").style.visibility="hidden"
            let locTableDiv = $('#savedLocations')
            locTableDiv.append(" <td class=\"center-align\" style=\"width: 100px\">\n" +
    "  <i style=\"margin-left: 5px; color:#ff6f00; cursor:pointer;\" class=\"material-icons\"\n" +
    "  @click=\"deativate(article.id)\">clear</i>\n" +
    "  <i class=\"material-icons\" style=\"margin-left: 2px; color:#ffc107; cursor:pointer;\"\n" +
    "  @click=\"getById(article), fillSelectCategories()\">edit</i>\n" +
    "  </td>\n" +
    "  <td><input type=\"text\" id=\""+pt+"_desc\" value=\""+new_form_data[pt+"_desc"]+"\"></td>\n" +
    "  <td><input type=\"text\" id=\""+pt+"_lat\" value=\""+new_form_data[pt+"_lat"]+"\"></td>\n" +
    "  <td><input type=\"text\" id=\""+pt+"_lng\" value=\""+new_form_data[pt+"_lng"]+"\"></td>\n" +
    "  <td><input type=\"text\" id=\""+pt+"_radius\" value=\""+new_form_data[pt+"_radius"]+"\"></td>\n" +
    "  <td><input type=\"text\" id=\""+pt+"_alert\" value=\""+null+"\"></td>")
            console.log("success", new_form_data)
            //addMarkers(map)
        },
        error: function (xhr, errmsg, err) {
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
            document.getElementById("progress_container").style.display = 'none';
            document.getElementById("add_point").style.visibility="hidden"
        }
    })

}

createGeoLocationMap()



