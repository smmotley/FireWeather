import createMap from './map.js'
import * as something_clicked from './util/marker_clicked.js'
import TileLoader from './lib/TileLoader.js'
import navBar from './lib/navBar.js';
import content from './lib/navBar-content.js'
import GridDataLoader from "./lib/grid/GridDataLoader.js";
import * as colorTexture from './lib/color-texture.js';
import TempDisplay from "./lib/temp-display.js"
//import pulsingDot from "./util/pulsingDot.js";
import * as addMarkers from "./util/addMarkers.js";
import * as currentFireTable from "./util/tableSort.js"
import * as mapboxButtons from "./lib/mapbox_button.js";
import satLooper from "./util/satImgLooper.js";

mapboxgl.accessToken = JSON.parse(document.getElementById('create-map').textContent);

//const layerToggles = new navBar(content);
const layerToggles = document.querySelectorAll(".map-toggle")
const animateButton = document.querySelectorAll("#animate")
const markerToggles = document.querySelector("#PCWA_Markers")
const CALfireToggles = document.querySelector("#CALfire_Markers")
const GOESfireToggles = document.querySelector("#GOESfire_Markers")

const VALUE_RANGE = [0, 255];
const valueMap = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    64,
    65,
    66,
    67,
    68,
    69,
    70,
    71,
    72,
    73,
    74,
    75,
    76,
    77,
    78,
    79,
    80,
    81,
    82,
    83,
    84,
    85,
    86,
    87,
    88,
    89,
    90,
    91,
    92,
    93,
    94,
    95,
    96,
    97,
    98,
    99,
    100,
    101,
    102,
    103,
    104,
    105,
    106,
    107,
    108,
    109,
    110,
    111,
    112,
    113,
    114,
    115,
    116,
    117,
    118,
    119,
    120,
    121,
    122,
    123,
    124,
    125,
    126,
    127,
    128,
    129,
    130,
    131,
    132,
    133,
    134,
    135,
    136,
    137,
    138,
    139,
    140,
    141,
    142,
    143,
    144,
    145,
    146,
    147,
    148,
    149,
    150,
    151,
    152,
    153,
    154,
    155,
    156,
    157,
    158,
    159,
    160,
    161,
    162,
    163,
    164,
    165,
    166,
    167,
    168,
    169,
    170,
    171,
    172,
    173,
    174,
    175,
    176,
    177,
    178,
    179,
    180,
    181,
    182,
    183,
    184,
    185,
    186,
    187,
    188,
    189,
    190,
    191,
    192,
    193,
    194,
    195,
    196,
    197,
    198,
    199,
    200,
    201,
    202,
    203,
    204,
    205,
    206,
    207,
    208,
    209,
    210,
    211,
    212,
    213,
    214,
    215,
    216,
    217,
    218,
    219,
    220,
    221,
    222,
    223,
    224,
    225,
    226,
    227,
    228,
    229,
    230,
    231,
    232,
    233,
    234,
    235,
    236,
    237,
    238,
    239,
    240,
    241,
    242,
    243,
    244,
    245,
    246,
    247,
    248,
    249,
    250,
    251,
    252,
    253,
    254,
    255
];
const vMap = createValueMap(...VALUE_RANGE);


function createValueMap(min, max) {
    const map = [...valueMap];

    for (let i = 0; i < 256; i++) {
        if (i <= min || i >= max) {
            map[i] = 0;
        }
    }
    return map;
}


function colorFunction(value, step = 0) {
    if (value === 0) return 'transparent';

//  const scaled = Math.round((-value / VALUE_RANGE[1]) * 360) + 220; //For radar
    const scaled = Math.round((value / VALUE_RANGE[1]) * 360); //the value is some percentage of 360
    const finalValue = (scaled + step) % 360;
    return `hsla(${finalValue}, 100%, 50%, 0.5)`;
}
function colorFunctionVisSat(value, step = 0) {
    value = value - 75;
    if (value < 40) return 'transparent';

//  const scaled = Math.round((-value / VALUE_RANGE[1]) * 360) + 220; //For radar
    const scaled = Math.round((value / VALUE_RANGE[1]) * 360); //the value is some percentage of 360
    const finalValue = (scaled + step) % 360;
    return `rgba(${finalValue}, ${finalValue},${finalValue},1)`
}

let geojson = {
    type: "FeatureCollection",
    features: [],
};

createMap(map => {
    const loader = new GridDataLoader();
    const tempDisplay = new TempDisplay();
    const tileSet = new TileLoader();
    let top_layer_url = undefined

    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxButtons.PitchToggle({minpitchzoom: 11}));
    map.addControl(new mapboxButtons.mapStyleToggle());

    layerToggles.forEach(function(elem){
            elem.addEventListener('change', () =>{
                const isChecked = elem.checked
                console.log(elem)
                if (!isChecked) {
                    animateButton[0].setAttribute('data-animating', 'nothing')
                    tileSet.removeTiles(map,elem.dataset.do)
                }
                else {
                    animateButton[0].setAttribute('data-animating', elem.dataset.do)
                    tileSet.loadTiles(map,loader,elem.dataset.do,colorTexture.create(vMap, colorFunctionVisSat), false)
                }
            })
         });

    animateButton.forEach(function (elem) {
        elem.addEventListener('click',() =>{

            var top_raster_id = find_top_layer(map, elem)

            // ANIMATION START REQUESTED
            if (elem.value === 'paused'){
                // Animation is being requested, so set the value to play
                elem.value = 'play'

                // Set which layer is animating. Note: getting the top layer ID would no longer work if this layer is
                // animating and someone adds another layer after the animation starts. In that case, you couldn't
                // stop the animation.
                elem.setAttribute('data-animating', top_raster_id)

                // Change the play button to a pause button
                $('.pause_play_button').text('pause_circle_outline')

                // Get the tiles to start animation.
                tileSet.loadTiles(map,loader,top_raster_id,colorTexture.create(vMap, colorFunctionVisSat), true)
            }

            // ANIMATION STOP REQUESTED
            else {
                elem.value = 'paused'
                var animating_layer = elem.getAttribute('data-animating')
                $('.pause_play_button').text('play_circle_outline')
                tileSet.animateTiles(map, animating_layer, 1, false)
            }
        })
    })

    markerToggles.addEventListener('change', (elem) => {
            const isChecked = elem.srcElement.checked
            if (isChecked) {
                addMarkers.pcwaMarkers.addmarkers(map)
            } else {
                addMarkers.pcwaMarkers.removemarkers(map)
            }
        })

    CALfireToggles.addEventListener('change', (elem) => {
            const isChecked = elem.srcElement.checked
            if (isChecked) {
                addMarkers.fireMarkers.add_calfire_markers(map)
            } else {
                addMarkers.fireMarkers.remove_calfire_markers(map)
            }
        })

    GOESfireToggles.addEventListener('change', (elem) => {
            const isChecked = elem.srcElement.checked
            if (isChecked) {
                addMarkers.fireMarkers.add_goes_fire_pixels(map)
            } else {
                addMarkers.fireMarkers.remove_goesfire_markers(map)
            }
        })

    const dateSlider = document.getElementById("timelineScrubber");
    const sliderTime = document.getElementById("timelineClock");
    var opacitySlider = document.getElementById('opacity_slider');
    // **********ANIMATION SLIDER CONTROLS FOR MAP***************
    dateSlider.oninput = function(e) {
        // Determine which layer to change
        var tile_id = find_top_layer(map, null)

        // When slider moves, stop all animations. Return value contains info on layer that stopped animating.
        var tileLayer = tileSet.animateTiles(map,tile_id,null,false)   // Stop Tile Animation

        // PAST --> PRESENT.
        // We always want time to increase as slider moves to the right (or decreases as slider moves left).
        // REQUIREMENTS: This code works because this.max was set by TileLoader when the tiles were loaded. We can
        //               use this to take the this.value of the slider, subtract that from the max and invert the value
        //               so that any non-forecast values will allow the slider to display PAST --> PRESENT as the
        //               slider is pulled from left to right.
         var frame = (parseInt(this.value) - parseInt(this.max)) * -1


        // PRESENT --> FUTURE.
        // If this is a forecast value, any movement to the right will increase time
        if (tileLayer.forecastValue === true){
            frame = parseInt(this.value)
        }

        // Find all layers on map
        var layers = map.getStyle().layers;

        // Get All id's for this product (e.g. radar0, radar1, radar2, etc.)
        const product_layers = layers.filter(item => item.id.includes(tile_id))

        // Set raster opacity of every tile with this name to zero, except the tile you want to display (see below).
        for (var product_layer of product_layers){
            map.setPaintProperty(product_layer.id, 'raster-opacity', 0);
        }

        // Is the layer we want to display already loaded? If not, load it.
        const result = async() => {
            const found = layers.some(el => el.id === tile_id + '-tiles' + frame)
            if (found === false){
                const load_tileset = await tileSet
                .loadTiles(map,loader,tile_id,colorTexture.create(vMap, colorFunctionVisSat), false, frame)
            }
        }

        var visible_layer_opacity = 0.7
            if (typeof opacitySlider.value !== 'undefined') {
                visible_layer_opacity = parseInt(opacitySlider.value, 10) / 100
            }
        // Set the opacity of the layer we want to view at 0.7
        console.log("Animation toggle opacity: " + visible_layer_opacity)
        map.setPaintProperty(tile_id + '-tiles' + frame, 'raster-opacity', visible_layer_opacity);

        // Update the slider with the correct time display
        var prettyTime = tileSet.range_slider_times(tile_id)
        sliderTime.innerText = prettyTime[frame]
    }
    //***********ANIMATION SLIDER END*******************


    //***********OPACITY SLIDER START*****************
    opacitySlider.oninput = function() {
        var layers = map.getStyle().layers;                                         // Find all layers
        const raster_layers = layers.filter(item => item.type.includes('raster'))   // Only get layers of type raster
        for (var product_layer of raster_layers) {
            console.log(product_layer.paint['raster-opacity'])
                if (product_layer.paint['raster-opacity'] !== 0){
                map.setPaintProperty(
                    product_layer.id,
                    'raster-opacity',
                    parseInt(this.value, 10) / 100
                );
            }
        }
    }
    //***********OPACITY SLIDER END*****************


     //***********FIRE TABLE JAVASCRIPT*****************
    // Initiate the table sorting function on our current fires list
    currentFireTable

    $(document).ready(function () {

		$(".fire_in_table").click(function () {
			addMarkers.fireMarkers.add_goes_fire_pixels(map)
			GOESfireToggles.checked = true
			var el = document.getElementById("dashboard_tabs")
			var map_tabs = M.Tabs.getInstance(el);
			map_tabs.select('mapbox_map')
			map.flyTo({
				center: [parseFloat(this.dataset.fire_lng), parseFloat(this.dataset.fire_lat),],
                zoom: 10,
				essential: true // this animation is considered essential with respect to prefers-reduced-motion
			});

			// New fires since the user last viewed page (given by the {{new_fire_count}} variable in template
			var new_fire_count = parseInt(document.getElementById("new_fire_badge").innerText)

            // If the fire that the user clicked on had a visible dot, we now need to hide the dot (mark as "read")
            // If style.display.length = 0, then it means the .dot class doesn't have a style.display attribute.
            if (this.querySelector('.dot').style.display.length === 0){
                this.querySelector('.dot').style.display = 'none'

                // In addition to hiding the dot, we need to change the number of "new fires" in our red circle.
                document.getElementById("new_fire_badge").innerText = (new_fire_count - 1).toString()

                // If the number of fires is now 0 (all have been "read") then just hide the red badge altogether.
                if (new_fire_count <= 1){
                    document.getElementById("new_fire_badge").style.display = 'none'
                }
            }
		});
		// Initiate a click event from the onset of the load so that we can sort the table by time.
        // New fires since the user last viewed page (given by the {{new_fire_count}} variable in template
		var new_fire_count = parseInt(document.getElementById("new_fire_badge").innerText)
        if (new_fire_count > 0){
            var table_sort = document.getElementById('table_viewed');
        }
        else{
           var table_sort = document.getElementById('table_time');
        }
        table_sort.click()
	})
    //**************END FIRE TABLE************************
    satLooper()
});

function find_top_layer(map, elem){
    // Only animate the top most layer (the layer that was added last)
    var layers = map.getStyle().layers;                             // Find all layers
    const raster_layers = layers
        //.filter(item => item.type.includes('raster') || item.id.includes("vis_sat"))               // Only get layers of type raster
        .filter(item => item.type.includes('raster'))               // Only get layers of type raster
    const top_raster = raster_layers.slice(-1)[0]                   // Top raster is last in list
    // Check to make sure the user has actually added a raster to the map. If not, alert user.
    if (top_raster == null){
            M.toast({html: "Add a layer to the map first",
                classes: 'red rounded', displayLength:3000});
            return
        }

    // All of our raster layer id's have a digit after them (e.g. radar0, radar1). Remove all digits to get
    // source id of the raster
    let top_raster_id = (top_raster.source).replace(/[0-9]/g,'')

    // The last layer the user added *should* be the top layer. Unless it's the satellite data, which
    // has been purposely put below all other rasters (include symbol layers like highways).
    if (elem != null) {
        const last_raster_added = elem.getAttribute('data-animating')

        // We could just say the layer to animate is always the last layer clicked, but instead we are double
        // checking and making sure the the top layer is actually a raster. If the top layer is radar, but we
        // clicked vis_sat last, this will animate vis_sat.
        if (last_raster_added !== top_raster_id && last_raster_added === 'vis_sat') {
            top_raster_id = 'vis_sat'
        }
    }
    return top_raster_id
}

$('.switch #precip').on('change.bootstrapSwitch', function(e) {
    console.log(e)
    var test = something_clicked.change_graph_type(e)
});

