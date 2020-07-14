import * as something_clicked from "./marker_clicked.js";

// Event listeners for deleting a point:

var el_fav1 = document.getElementsByClassName("delete_location_fav1");
var el_fav2 = document.getElementsByClassName("delete_location_fav2");
Array.from(el_fav1).forEach(function(element) {
      element.addEventListener("click", () => delete_point('fav1'))
    });

Array.from(el_fav2).forEach(function(element) {
      element.addEventListener("click", () => delete_point('fav2'))
    });

let geojson = {
    type: "FeatureCollection",
    features: [],
};

var popup = null

function json2geojson(json){
    for (var i = 0; i < json.data.length; i++) {
    geojson.features.push({
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [json.data[i]["-lon"], json.data[i]["-lat"]]
        },
        "properties": {
            "id": json.data[i]["id"],
            "info": json.data[i]["name"],
            "type": json.data[i]["type"]
        }
    });
}
return geojson
}

export function pcwaMarkers(map){
d3.json('/static/site_data/station_locations.json')
        .then((data) => {
            geojson = json2geojson(data);
            geojson.features.forEach(function(feature){

                // create a HTML element for each feature
                var el = document.createElement('div');
                el.className = 'marker';
                el.id = 'marker_' + feature.properties.id;
                if (feature.properties.type == 'POWERHOUSE'){
                        el.style.backgroundImage = 'url(/static/images/map_markers/pp_marker.png)';
                        el.style.width = '25px';
                        el.style.height = '30px';
                    }

                 if (feature.properties.type == 'CNRFC'){
                        el.style.backgroundImage = 'url(/static/images/map_markers/red_marker.png)';
                        el.style.width = '25px';
                        el.style.height = '30px';
                    }
                let popup = new mapboxgl.Popup({
                    offset: 25,
                    closeButton: false,
                    closeOnClick: true
                }).setHTML(feature.properties.id +'<br>'+ feature.properties.info);

                new mapboxgl.Marker(el)
                        .setLngLat(feature.geometry.coordinates)
                        .addTo(map)
                        .setPopup(popup);
                el.addEventListener('click', (e) =>
                {
                   let station_name = (e.target.id).split("_");
                   //console.log(station_name);
                   something_clicked.marker_clicked(station_name[1])
                })
                el.addEventListener('mouseover', (e) =>
                {
                   let station_name = (e.target.id).split("_");
                   popup.addTo(map);
                   //console.log(station_name);
                })
                el.addEventListener('mouseout', (e) =>
                {
                   let station_name = (e.target.id).split("_");
                   popup.remove();
                   //console.log(station_name);
                })

            });
        });
}

export function fireMarkers(map){
    fire_data.features.forEach(function(feature){
        // create a HTML element for each feature
                var el = document.createElement('div');
                el.className = 'fire_marker';
                el.id = 'fire_marker_' + feature.properties.id;
                if (feature.properties.type != 'POWERHOUSE'){
                        el.style.backgroundImage = 'url(/static/images/map_markers/fire_marker.png)';
                        el.style.width = '25px';
                        el.style.height = '30px';
                    }

                let popup = new mapboxgl.Popup({
                    offset: 25,
                    closeButton: true,
                    closeOnClick: true
                }).setHTML(
                    "    <div class=\"col s12 m6\">\n" +
                    "      <div class=\"card\">\n" +
                    "        <div class=\"card-image\"> <img src=\"data:image/png;base64," + goes_image + "\">\n" +
                    "          <span class=\"card-title\">" + feature.properties.fire_name + "</span>\n" +
                    "          <p>I am a very simple card. I am good at containing small bits of information.\n" +
                    "          I am convenient because I require little markup to use effectively.</p>\n" +
                    "        </div>\n" +
                    "        <div class=\"card-action\">\n" +
                    "          <a href=\" "+ feature.properties.fire_url +  "\">Additional Fire Info</a>\n" +
                    "          <a href=\"#\">This is a link</a>\n" +
                    "        </div>\n" +
                    "      </div>\n" +
                    "    </div>\n");

                new mapboxgl.Marker(el)
                        .setLngLat(feature.geometry.coordinates)
                        .addTo(map)
                        .setPopup(popup);
                el.addEventListener('click', (e) =>
                {
                   let station_name = (e.target.id).split("_");
                   //console.log(station_name);
                   something_clicked.marker_clicked(station_name[1])
                })
                el.addEventListener('mouseover', (e) =>
                {
                   let station_name = (e.target.id).split("_");
                   popup.addTo(map);
                   //console.log(station_name);
                })
                el.addEventListener('mouseout', (e) =>
                {
                   let station_name = (e.target.id).split("_");
                   popup.remove();
                   //console.log(station_name);
                })

        });

    goes_fire_pixels.features.forEach(function(feature){
        // create a HTML element for each feature
                var el = document.createElement('div');
                el.className = 'goes_marker';
                el.id = 'goes_marker_' + feature.properties.id;
                if (feature.properties.type == 'goes_pixel'){
                        el.style.backgroundImage = 'url(/static/images/map_markers/fire_marker_blue.png)';
                        el.style.width = '25px';
                        el.style.height = '30px';
                    }

                let popup = new mapboxgl.Popup({
                    offset: 25,
                    closeButton: true,
                    closeOnClick: true
                }).setHTML(
                    "    <div class=\"col s12 m6\">\n" +
                    "      <div class=\"card\">\n" +
                    "        <div class=\"card-image\"> <img src=\"data:image/png;base64," + goes_image + "\">\n" +
                    "          <span class=\"card-title\">" + feature.properties.fire_name + "</span>\n" +
                    "          <p>I am a very simple card. I am good at containing small bits of information.\n" +
                    "          I am convenient because I require little markup to use effectively.</p>\n" +
                    "        </div>\n" +
                    "        <div class=\"card-action\">\n" +
                    "          <a href=\" "+ feature.properties.fire_url +  "\">Additional Fire Info</a>\n" +
                    "          <a href=\"#\">This is a link</a>\n" +
                    "        </div>\n" +
                    "      </div>\n" +
                    "    </div>\n");

                new mapboxgl.Marker(el)
                        .setLngLat(feature.geometry.coordinates)
                        .addTo(map)
                        .setPopup(popup);
                el.addEventListener('click', (e) =>
                {
                   let station_name = (e.target.id).split("_");
                   //console.log(station_name);
                   something_clicked.marker_clicked(station_name[1])
                })
                el.addEventListener('mouseover', (e) =>
                {
                   let station_name = (e.target.id).split("_");
                   popup.addTo(map);
                   //console.log(station_name);
                })
                el.addEventListener('mouseout', (e) =>
                {
                   let station_name = (e.target.id).split("_");
                   popup.remove();
                   //console.log(station_name);
                })

        });
    var size = 200;
    // implementation of CustomLayerInterface to draw a pulsing dot icon on the map
    // see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
    var pulsingDot = {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),

// get rendering context for the map canvas when layer is added to the map
        onAdd: function () {
            var canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            this.context = canvas.getContext('2d');
        },

// called once before every frame where the icon will be used
        render: function () {
            var duration = 1000;
            var t = (performance.now() % duration) / duration;

            var radius = (size / 2) * 0.3;
            var outerRadius = (size / 2) * 0.7 * t + radius;
            var context = this.context;

// draw outer circle
            context.clearRect(0, 0, this.width, this.height);
            context.beginPath();
            context.arc(
                this.width / 2,
                this.height / 2,
                outerRadius,
                0,
                Math.PI * 2
            );
            context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
            context.fill();

// draw inner circle
            context.beginPath();
            context.arc(
                this.width / 2,
                this.height / 2,
                radius,
                0,
                Math.PI * 2
            );
            context.fillStyle = 'rgba(255, 100, 100, 1)';
            context.strokeStyle = 'white';
            context.lineWidth = 2 + 4 * (1 - t);
            context.fill();
            context.stroke();

// update this image's data with data from the canvas
            this.data = context.getImageData(
                0,
                0,
                this.width,
                this.height
            ).data;

// continuously repaint the map, resulting in the smooth animation of the dot
            map.triggerRepaint();

// return `true` to let the map know that the image was updated
            return true;
        }
    };

    map.addImage('pulsing-dots', pulsingDot, { pixelRatio: 2 });
    map.addSource('dot-points', {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': [{
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Point',
                                'coordinates': [-120, 39]
                            }
                        }]
                    }
    });
    map.addLayer({
            'id': 'dot-points',
            'type': 'symbol',
            'source': 'dot-points',
            'layout': {
            'icon-image': 'pulsing-dot'
            }
            });
}

var createGeoJSONCircle = function(center, radiusInKm, points) {
    if(!points) points = 64;

    var coords = {
        latitude: center[1],
        longitude: center[0]
    };

    var km = radiusInKm;

    var ret = [];
    var distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
    var distanceY = km/110.574;

    var theta, x, y;
    for(var i=0; i<points; i++) {
        theta = (i/points)*(2*Math.PI);
        x = distanceX*Math.cos(theta);
        y = distanceY*Math.sin(theta);

        ret.push([coords.longitude+x, coords.latitude+y]);
    }
    ret.push(ret[0]);

    return {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [ret]
                }
            }]
        }
    };
};

export function userMarkers(map, geolocation_data) {
    const elem = document.getElementById('location_modal');
    const instance = M.Modal.init(elem, {dismissible: false});
    if (geolocation_data){
        console.log(geolocation_data.geometry)
        location_data.features.push({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": geolocation_data.geometry.coordinates
            },
            "properties": {
                "id": 'new_geolocation',
                "radius": 50,
                "description": geolocation_data.text
            }
            })
        }

    //if (location_data.features.length > 3) {
    //    instance.open()
    //    return
    //}
    var canvas = map.getCanvasContainer();
    //var pulsingDot = generate_pulsing_dot(map)

    location_data.features.forEach(function (feature) {
        var fLat = Math.round(feature.geometry.coordinates[1] * 1000) / 1000
        var fLng = Math.round(feature.geometry.coordinates[0] * 1000) / 1000
        var source_id = 'point' + feature.properties.id
        var layer_id = 'user_marker_' + feature.properties.id

        var polygon_source_id = 'poly_' + feature.properties.id
        var polygon_id = 'poly_marker_' + feature.properties.id
        //var image_id = 'user_dot_' + feature.properties.id
        //map.addImage(image_id, pulsingDot, { pixelRatio: 2 });

        // create a HTML element for each feature
        if (!map.getSource(polygon_source_id)) {
            map.addSource(polygon_source_id, createGeoJSONCircle(feature.geometry.coordinates, feature.properties.radius * 0.62));

            map.addLayer({
                "id": polygon_id,
                "type": "fill",
                "source": polygon_source_id,
                "layout": {},
                "paint": {
                    "fill-color": "blue",
                    "fill-opacity": 0.3
                }
                }
               );
        }

        if (!map.getSource(source_id)) {
            map.addSource(source_id, {
                'type': 'geojson',
                'data': feature
            });

            map.addLayer({
                'id': layer_id,
                'type': 'circle',
                'source': source_id,
                /* // For Pulsing Dot
                'type': 'symbol',
                'layout': {
                    'icon-image': image_id
                }
                 */
                'paint': {
                    'circle-radius': 10,
                    'circle-color': '#0f4be3',
                    'circle-opacity': 0.7,
                    'circle-stroke-color': '#e8e2ec',
                    'circle-stroke-width': 2,
                    'circle-stroke-opacity': 0.5
                }
            });
        }
        var popupHTML = "    <div class=\"card grey-box gradient-shadow\">\n" +
        "      <div class=\"card-content popup white-text\">\n" +
        "          <span class=\"card-title center-align no-margin\">" + feature.properties.description + "</span>\n" +
        "           <div class=\"center-align\">Drag Marker To Adjust</div>\n" +
        "           <div class=\"divider\"></div>\n" +
        "          <div id='coordinates' class='coordinates'>" +
        "               <b>Lng: </b>" + fLng + "    <b>Lat: </b>" + fLat  +
        "          </div>" +
        "           <div class=\"divider\"></div>\n" +
        "          <div id='alertRadius'><b>Alert Radius: " + feature.properties.radius + " Miles</b>" +
        "          </div>\n" +
        "           <div class=\"range-field\">" +
        "               <input type=\"range\" id=\"marker_range\" min=\"0\" max=\"600\"/>" +
        "           </div>" +
        "          <div class='center-align'><button id=\"add_new_point_"+feature.properties.id+ "\" class=\"btn-small indigo waves-effect waves-light\">Save Changes</button></div>\n" +
        "        </div>\n" +
        "      </div>\n"


        map.on('click', layer_id, function (e) {
            popup = new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(popupHTML)
                .addTo(map)

            var lngLatPop = [e.lngLat.lng, e.lngLat.lat]
            coordinates.innerHTML =
            '<b>Lng: </b>' + Math.round(lngLatPop[0] * 1000) / 1000 + '<b>Lat: </b>' +
            Math.round(lngLatPop[1] * 1000) / 1000;


            var markerlngLat = [e.lngLat.lng, e.lngLat.lat]
            var slider = document.getElementById("marker_range");
            document.getElementById("add_new_point_"+feature.properties.id)
                .addEventListener("click", function (ev) {
                     ev.preventDefault()
                     addLocation(feature, feature.properties.id)
            })
            //M.Range.init(slider)
            slider.oninput = function() {
                    //output.innerHTML = this.value;
                var data = createGeoJSONCircle(markerlngLat, (this.value)*0.62)
                map.getSource(polygon_source_id).setData(data.data)
                feature.properties.radius = this.value
                alertRadius.innerHTML = "</div><b>Alert Radius: " + this.value + " Miles</b> "
                $("#add_new_point_"+feature.properties.id).addClass('pulse');
                }

        });

        function onMove(e) {
            var coords = e.lngLat;
            var lngLat = [e.lngLat.lng, e.lngLat.lat]
            if (popup.isOpen()){
                popup.remove()          // Leaving the popup open was causing all kinds of problems
                coordinates.innerHTML =
            '<b>Lng: </b>' + Math.round(lngLat[0] * 1000) / 1000 + '<b>Lat: </b>' +
            Math.round(lngLat[1] * 1000) / 1000;
            }

            var data = createGeoJSONCircle(lngLat, (feature.properties.radius)*0.62)
            popup.setLngLat(coords)

            // Set a UI indicator for dragging.
            canvas.style.cursor = 'grabbing';

            // Update the Point feature in `geojson` coordinates
            // and call setData to the source layer `point` on it.
            feature.geometry.coordinates = [coords.lng, coords.lat];
            map.getSource(source_id).setData(feature);
            map.getSource(polygon_source_id).setData(data.data)
        }

        function onUp(e) {
            var coords = e.lngLat;

            // Print the coordinates of where the point had
            // finished being dragged to on the map.
            //coordinates.style.display = 'block';
            //coordinates.innerHTML =
            //'Longitude: ' + coords.lng + '<br />Latitude: ' + coords.lat;
            canvas.style.cursor = '';

            // Unbind mouse/touch events
            map.off('mousemove', onMove);
            map.off('touchmove', onMove);
        }

        // When the cursor enters a feature in the point layer, prepare for dragging.
        map.on('mouseenter', 'user_marker_' + feature.properties.id, function () {
            map.setPaintProperty('user_marker_' + feature.properties.id, 'circle-color', '#3bb2d0');
            canvas.style.cursor = 'move';
        });

        map.on('mouseleave', 'user_marker_' + feature.properties.id, function () {
            map.setPaintProperty('user_marker_' + feature.properties.id, 'circle-color', '#3887be');
            canvas.style.cursor = '';
        });

        map.on('mousedown', 'user_marker_' + feature.properties.id, function (e) {
            // Prevent the default map drag behavior.
            e.preventDefault();

            canvas.style.cursor = 'grab';

            map.on('mousemove', onMove);
            map.once('mouseup', onUp);
        });

        map.on('touchstart', 'user_marker_' + feature.properties.id, function (e) {
            if (e.points.length !== 1) return;

            // Prevent the default map drag behavior.
            e.preventDefault();

            map.on('touchmove', onMove);
            map.once('touchend', onUp);
        });
    })
}

function generate_pulsing_dot(map){
    var size = 200;
    // implementation of CustomLayerInterface to draw a pulsing dot icon on the map
    // see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
    var pulsingDot = {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),

// get rendering context for the map canvas when layer is added to the map
        onAdd: function () {
            var canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            this.context = canvas.getContext('2d');
        },

// called once before every frame where the icon will be used
        render: function () {
            var duration = 1000;
            var t = (performance.now() % duration) / duration;

            var radius = (size / 2) * 0.3;
            var outerRadius = (size / 2) * 0.7 * t + radius;
            var context = this.context;

// draw outer circle
            context.clearRect(0, 0, this.width, this.height);
            context.beginPath();
            context.arc(
                this.width / 2,
                this.height / 2,
                outerRadius,
                0,
                Math.PI * 2
            );
            context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
            context.fill();

// draw inner circle
            context.beginPath();
            context.arc(
                this.width / 2,
                this.height / 2,
                radius,
                0,
                Math.PI * 2
            );
            context.fillStyle = 'rgba(255, 100, 100, 1)';
            context.strokeStyle = 'white';
            context.lineWidth = 2 + 4 * (1 - t);
            context.fill();
            context.stroke();

// update this image's data with data from the canvas
            this.data = context.getImageData(
                0,
                0,
                this.width,
                this.height
            ).data;

// continuously repaint the map, resulting in the smooth animation of the dot
            map.triggerRepaint();

// return `true` to let the map know that the image was updated
            return true;
        }
    };
    console.log(pulsingDot)
    return pulsingDot
}



export function new_geocoder_marker(map, ev) {
    var geocoder_result = ev.result;
    var radius = 50
    var canvas = map.getCanvasContainer();
    var fLat = Math.round(ev.result.center[1] * 1000) / 1000
    var fLng = Math.round(ev.result.center[0] * 1000) / 1000
    var source_id = 'point_new'
    var layer_id = 'user_marker_new'

    var polygon_source_id = 'poly_new'
    var polygon_id = 'poly_marker_new'

    var feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [fLng, fLat]
        },
        "properties": {
            "id": ev.result.text,
            "radius": 50
        }
    }
    //var image_id = 'user_dot_' + feature.properties.id
    //map.addImage(image_id, pulsingDot, { pixelRatio: 2 });

    // create a HTML element for each feature
    map.addSource(polygon_source_id, createGeoJSONCircle([ev.result.center[0],ev.result.center[1]], 50*0.62));

    map.addLayer({
        "id": polygon_id,
        "type": "fill",
        "source": polygon_source_id,
        "layout": {},
        "paint": {
            "fill-color": "blue",
            "fill-opacity": 0.3
        }
        }
       );

    map.addSource(source_id, {
        'type': 'geojson',
        "data": {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [fLng, fLat]
        },
        "properties": {
            "title": "New User Point",
        }
    }
    });

    map.addLayer({
        'id': layer_id,
        'type': 'circle',
        'source': source_id,
        /* // For Pulsing Dot
        'type': 'symbol',
        'layout': {
            'icon-image': image_id
        }
         */
        'paint': {
            'circle-radius': 10,
            'circle-color': '#0f4be3',
            'circle-opacity': 0.7,
            'circle-stroke-color': '#e8e2ec',
            'circle-stroke-width': 2,
            'circle-stroke-opacity': 0.5
        }
    });

     var popupHTML = "    <div class=\"card grey-box gradient-shadow\">\n" +
        "      <div class=\"card-content popup white-text\">\n" +
        "          <span class=\"card-title center-align no-margin\">" + ev.result.text + "</span>\n" +
        "           <div class=\"center-align\">Drag Marker To Adjust</div>\n" +
        "           <div class=\"divider\"></div>\n" +
        "          <div id='coordinates' class='coordinates'>" +
        "               <b>Lng: </b>" + fLng + "    <b>Lat: </b>" + fLat  +
        "          </div>" +
        "           <div class=\"divider\"></div>\n" +
        "          <div id='alertRadius'><b>Alert Radius: " + feature.properties.radius + " Miles</b>" +
        "          </div>\n" +
        "           <div class=\"range-field\">" +
        "               <input type=\"range\" id=\"marker_range_new\" min=\"0\" max=\"600\"/>" +
        "           </div>" +
        "          <div class='center-align'><button id=\"add_new_point_"+feature.properties.id+ "\" class=\"btn-small indigo waves-effect waves-light\">Save Changes</button></div>\n" +
        "        </div>\n" +
        "      </div>\n"


    map.on('click', layer_id, function (e) {
        popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(popupHTML)
            .addTo(map)


        var markerlngLat = [e.lngLat.lng, e.lngLat.lat]
        var slider = document.getElementById("marker_range_new");
        console.log(slider)
        document.getElementById("add_new_point_"+feature.properties.id)
            .addEventListener("click", function (ev) {
                 ev.preventDefault()
                  addLocation(feature, null)
        })
        //M.Range.init(slider)
        slider.oninput = function() {
                //output.innerHTML = this.value;
            var data = createGeoJSONCircle(markerlngLat, (this.value)*0.62)
            map.getSource(polygon_source_id).setData(data.data)
            feature.properties.radius = this.value
            alertRadius.innerHTML = "</div><b>Alert Radius: " + this.value + " Miles</b> "
            }

    });

    function onMove(e) {
            popup.remove()          // Leaving the popup open was causing all kinds of problems
            var coords = e.lngLat;
            var lngLat = [e.lngLat.lng, e.lngLat.lat]
            var data = createGeoJSONCircle(lngLat, (feature.properties.radius)*0.62)
            popup.setLngLat(coords)

            // Set a UI indicator for dragging.
            canvas.style.cursor = 'grabbing';

            // Update the Point feature in `geojson` coordinates
            // and call setData to the source layer `point` on it.
            feature.geometry.coordinates = [coords.lng, coords.lat];
            map.getSource(source_id).setData(feature);
            map.getSource(polygon_source_id).setData(data.data)
            coordinates.innerHTML =
            '<b>Lng: </b>' + Math.round(lngLat[0] * 1000) / 1000 + '<b>Lat: </b>' +
            Math.round(lngLat[1] * 1000) / 1000;
        }

        function onUp(e) {
            var coords = e.lngLat;

            // Print the coordinates of where the point had
            // finished being dragged to on the map.
            //coordinates.style.display = 'block';
            //coordinates.innerHTML =
            //'Longitude: ' + coords.lng + '<br />Latitude: ' + coords.lat;
            canvas.style.cursor = '';

            // Unbind mouse/touch events
            map.off('mousemove', onMove);
            map.off('touchmove', onMove);
        }

        // When the cursor enters a feature in the point layer, prepare for dragging.
        map.on('mouseenter', 'user_marker_' + feature.properties.id, function () {
            map.setPaintProperty('user_marker_' + feature.properties.id, 'circle-color', '#3bb2d0');
            canvas.style.cursor = 'move';
        });

        map.on('mouseleave', 'user_marker_' + feature.properties.id, function () {
            map.setPaintProperty('user_marker_' + feature.properties.id, 'circle-color', '#3887be');
            canvas.style.cursor = '';
        });

        map.on('mousedown', 'user_marker_' + feature.properties.id, function (e) {
            // Prevent the default map drag behavior.
            e.preventDefault();

            canvas.style.cursor = 'grab';

            map.on('mousemove', onMove);
            map.once('mouseup', onUp);
        });

        map.on('touchstart', 'user_marker_' + feature.properties.id, function (e) {
            if (e.points.length !== 1) return;

            // Prevent the default map drag behavior.
            e.preventDefault();

            map.on('touchmove', onMove);
            map.once('touchend', onUp);
        });
}

function addLocation(geocoder_result, pt_overRide) {
    /* Only two locations can be added by the user. The geojson is created in the view by looking
    in the database for non-null values in user_lat, fav1_lat, fav2_lat. If any of these are null, they are not
    added to the geojson. Therefore, the existence of both fav1 and fav2 means two favorites have already been saved.
     */

    // This is a new point, not an update to an existing point.
    if (pt_overRide == 'new_geolocation'){pt_overRide = false}

    const elem = document.getElementById('location_modal');
    const instance = M.Modal.init(elem, {dismissible: false});
    console.log("ADDING LOCATION")
    document.getElementById("progress_container").style.display = 'block';
    let pt = "fav1"             // Start under the assumption that this is for the first saved point.
    let pt1_full = false        // Holder for whether saved pt1 is full (pt1 could be empty when pt2 is full).
    for (var [key,val] of Object.entries(location_data.features)){
        // Test if fav1 is occupied with a latlng, then it's occupied.
        if (val.properties.id === "fav1" && val.geometry.coordinates[1] != null){
            pt = "fav2"         // Since there is a val for "fav1", change to "fav2".
            pt1_full = true     // Let the holder know that "fav1" has a value (this is in case fav2 exists, but fav1 is empty)
        }
        if (pt_overRide){
            pt1_full = false    // Note: This is so the next if statement doesn't open the modeal
            pt = pt_overRide    //pt_override will = 'fav1' or 'fav2'
            instance.close()
        }
        // Test if fav2 is occupied with a value AND fav1 has a value.
        // If fav2 is full and fav1 is full, then alert the user that they need to delete on of their saved locations.
        if (val.properties.id === "fav2" && pt1_full && val.geometry.coordinates[1] != null) {
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
        try{
            new_form_data[pt+'_radius'] = geocoder_result.properties.radius
        }
        catch(e){
            console.log(e, "No radius issued with geocoder result, using default val instead")
        }
        try {
            new_form_data[pt + "_desc"] = geocoder_result.text
        }
        catch (e) {
            console.log(e, "Trying to fill description with geocoder. This must be an edit, " +
                "filling with previous description.")
        }
        try{
            new_form_data[pt + "_desc"] = geocoder_result.properties.description
        }
        catch(e){
            console.log(e, "Trying to edit a new location, but description is un avail in feature", geocoder_result)
        }
    }

    new_form_data['csrfmiddlewaretoken'] = $('input[name=csrfmiddlewaretoken]').val()
    new_form_data['action'] = 'post'
    console.log(new_form_data)

    $.ajax({
        type: 'POST',
        url: 'change_location',
        data: new_form_data,
        success: function (json) {
            M.toast({html: "Location Added", classes: 'green rounded', displayLength:2000});
            document.getElementById("progress_container").style.display = 'none';
            document.getElementById("add_point").style.visibility="hidden"
            $('#'+pt+'-edit-icons').show()
            $('input[id='+pt+'_desc]')
                .val(new_form_data[pt+"_desc"])
                .attr("type","text");
            $('input[id='+pt+'_lat]')
                .val(new_form_data[pt+"_lat"])
                .attr("type","text");
            $('input[id='+pt+'_lng]')
                .val(new_form_data[pt+"_lng"])
                .attr("type","text");
            $('input[id='+pt+'_radius]')
                .val(new_form_data[pt+"_radius"])
                .attr("type","text");
            $('input[id='+pt+'_alert]')
                .val("")
                .attr("type","text");
        },
        error: function (xhr, errmsg, err) {
            M.toast({html: "Failed To Add Location", classes: 'red rounded', displayLength:2000});
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
            document.getElementById("progress_container").style.display = 'none';
            document.getElementById("add_point").style.visibility="hidden"
        }
    })

}

function delete_point(pt){
    console.log("Deleting Point")
    const el = document.getElementById('location_modal');
    var modal = M.Modal.getInstance(el)
    // ADD A SUBMIT BUTTON ON MODAL AND GRAY OUT FIELD
    //The only way to get dynamic variables into an ajax call is to build the object this way:
    let new_form_data = user_profile[0].fields
    if (pt){
        new_form_data[pt+"_lat"] = ""
        new_form_data[pt+"_lng"] = ""
        new_form_data[pt+'_radius'] = 50
        new_form_data[pt + "_desc"] = ""
        new_form_data[pt + "_desc"] = ""
    }

    new_form_data['csrfmiddlewaretoken'] = $('input[name=csrfmiddlewaretoken]').val()
    new_form_data['action'] = 'post'
    $.ajax({
        type: 'POST',
        url: 'change_location',
        data: new_form_data,
        success: function (json) {
            modal.close()
            document.getElementById("progress_container").style.display = 'none';
            document.getElementById("add_point").style.visibility="hidden"
            M.toast({html: "Point Deleted", classes: 'red rounded', displayLength:2000});
            //addMarkers(map)
        },
        error: function (xhr, errmsg, err) {
            M.toast({html: "Failed To Delete", classes: 'red rounded', displayLength:2000});
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
            document.getElementById("progress_container").style.display = 'none';
            document.getElementById("add_point").style.visibility="hidden"
        }
    })
}

