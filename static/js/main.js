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

mapboxgl.accessToken = JSON.parse(document.getElementById('create-map').textContent);

//const layerToggles = new navBar(content);
const layerToggles = document.querySelectorAll("input[type=checkbox]")
const animateButton = document.querySelectorAll("#animator")


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
    layerToggles.forEach(function(elem){
            elem.addEventListener('change', () =>{
                console.log(elem)
                const isChecked = elem.checked
                if (!isChecked) tileSet.removeTiles(map,elem.dataset.do);
                else tileSet.loadTiles(map,loader,1,elem.dataset.do,colorTexture.create(vMap, colorFunctionVisSat))
            })
         });
    animateButton.forEach(function (elem) {
        elem.addEventListener('change',() =>{
            console.log("Animating")
            tileSet.loadTiles(map,loader,6,elem.dataset.do,colorTexture.create(vMap, colorFunctionVisSat))
        })
    })
   const pcwaMarkers = addMarkers.pcwaMarkers(map)
   const fireMarkers = addMarkers.fireMarkers(map)

});

$('.switch #precip').on('change.bootstrapSwitch', function(e) {
    console.log(e)
    var test = something_clicked.change_graph_type(e)
});