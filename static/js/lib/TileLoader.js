import * as colorTexture from "./color-texture.js";
import * as tilebelt from "./grid/tilebelt.js";
import ProgressPromise from "./Progress_Promise.js"
import layer_constructor from "../util/layer_constructor.js";

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
window.tileLayers = {};
window.colormap = {}
var imgLooper = null;
var dateSlider = document.getElementById("timelineClock");

tileLayers.baseURL={
    RADAR_COMP: (tile_names,i) => `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-${tile_names[i]}/{z}/{x}/{y}.png`,
    HRRR_REFL: (tile_names,i) => `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/hrrr::REFD-F${tile_names[i]}-0/{z}/{x}/{y}.png`,
    PRECIP_TOTALS_24HR: (tile_names,i) => `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/q2-n24p-900913/{z}/{x}/{y}.png`,
    PRECIP_TOTALS_48HR: (tile_names,i) => `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/q2-n48p-900913/{z}/{x}/{y}.png`,
    PRECIP_TOTALS_72HR: (tile_names,i) => `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/q2-n72p-900913/{z}/{x}/{y}.png`,
    SWE: (tile_names,i) => `https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/WmsServer?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}`,
    NDFD_MAX_TEMP: (tile_names,i) =>`https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Observations/radar_base_reflectivity/MapServer/WMSServer?LAYERS=1&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_MIN_TEMP: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=0&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}&VT=${tile_names[i]}`,
    NDFD_POP: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.pop&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_QPF: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.qpf&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_SKY: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.sky&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_SNOW: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.snow&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_TEMP: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.temp&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_DEWPT: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.td&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_WDIR: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.wdir&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_WSPD: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.wspd&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_WX: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.wx&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_WAVEH: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.waveh&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_WGUST: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.wgust&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_MAXRH: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.maxrh&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_MINRH: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.minrh&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_SNOWLEVEL: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.snowlevel&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_30d: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.45d&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_14D_TEMP: (tile_names,i) =>`https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Climate_Outlooks/cpc_8_14_day_outlk/MapServer/WmsServer?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}`,
    NDFD_14D_PRECIP: (tile_names,i) =>`https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Climate_Outlooks/cpc_8_14_day_outlk/MapServer/WmsServer?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=0&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&STYLES=&BBOX={bbox-epsg-3857}`,
    NDFD_90d: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.375d&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_TOR: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.ptornado&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_HAIL: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.phail&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    LIGHTNING: (tile_names,i) =>`https://services.arcgis.com/BLN4oKB0N1YSgvY8/arcgis/rest/services/Power_Outages_(View)/FeatureServer/LAYERS=1&SERVICE=WMS&REQUEST=GetMap&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&f=image`,
    //LIGHTNING: (tile_names,i) =>`https://idpgis.ncep.noaa.gov/arcgis/services/NWS_Forecasts_Guidance_Warnings/watch_warn_adv/MapServer/WMSServer?LAYERS=0&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&f=image`,
    NDFD_STORMS: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.ptotsvrtstm&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    NDFD_FIRE_DRYLIGHTNING: (tile_names,i) =>`https://cors-anywhere.herokuapp.com/digital.weather.gov/wms.php?LAYERS=ndfd.conus.dryfireo&FORMAT=image/png&TRANSPARENT=TRUE&VERSION=1.3.0&VT=${tile_names[i]}&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`,
    MODIS_FIRES: (tile_names,i) => `https://firms.modaps.eosdis.nasa.gov/wms/key/87c632537b483724aa75fc7550f1d34a/?REQUEST=GetMap&layers=fires_viirs_24,fires_modis_24&WIDTH=256&HEIGHT=256&symbols=cross,circle&colors=240+40+40,250+200+50&size=8,8&BBOX={bbox-epsg-3857}&SRS=EPSG:3857`,


    //NDFD_MIN_TEMP: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_time/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:3857&size={{width}}%2C{{height}}&bboxSR=3857&IMAGESR=3857&f=image&layers={{layer}}&time={{time}}",

    //RADAR_STATIC:"http://radblast.wunderground.com/cgi-bin/radar/WUNIDS_composite?maxlat={{maxlat}}&maxlon={{maxlon}}&minlat={{minlat}}&minlon={{minlon}}&type=N0R&frame=0&num=1&delay=25&width={{width}}&height={{height}}&png=0&smooth=1&min=0&noclutter=1&rainsnow=1&nodebug=0&theext=.gif&timelabel=1&timelabel.x=200&timelabel.y=12&brand=wundermap&reproj.automerc=1",
    /*RADAR_STATIC:"http://radblast.wunderground.com/cgi-bin/radar/WUNIDS_composite?maxlat={{maxlat}}&maxlon={{maxlon}}&minlat={{minlat}}&minlon={{minlon}}&width={{width}}&height={{height}}&type=00Q&frame=0&num=1&delay=25&png=0&min=0&rainsnow=1&nodebug=0&theext=.gif&timelabel=0&timelabel.x=200&timelabel.y=12&brand=wundermap&smooth=1&radar_bitmap=1&noclutter=1&noclutter_mask=1&cors=1",*/
    //RADAR_ANIMATED:"http://radblast.wunderground.com/cgi-bin/radar/WUNIDS_composite?maxlat={{maxlat}}&maxlon={{maxlon}}&minlat={{minlat}}&minlon={{minlon}}&type=N0R&frame=0&num=7&delay=25&width={{width}}&height={{height}}&png=0&smooth=1&min=0&noclutter=1&rainsnow=1&nodebug=0&theext=.gif&merge=elev&reproj.automerc=1&timelabel=1&timelabel.x=200&timelabel.y=12&brand=wundermap",
    VIS_SATELLITE: (tile_names,i) => `https://a.tiles.mapbox.com/v4/smotley.GOES17_${tile_names[i]}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic21vdGxleSIsImEiOiJuZUVuMnBBIn0.xce7KmFLzFd9PZay3DjvAA`,
    VIS_SATELLITE_VECTOR: (tile_names,i) => `mapbox://smotley.GOES17_${tile_names[i]}`,
    //VIS_SATELLITE: (tile_names,i) => `https://re-c.ssec.wisc.edu/api/image?products=G17-ABI-CONUS-BAND02_${tile_names[0]}_${tile_names[1]}&z={z}&x={x}&y={y}`,
    //VIS_SATELLITE: (tile_names,i) => `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-west-vis-1km-900913/{z}/{x}/{y}.png`
    HRRR_SMOKE: (tile_names,i) => `https://re-c.ssec.wisc.edu/api/image?products=HRRR-smoke-surface_${tile_names[0]}_${tile_names[1]}&z={z}&x={x}&y={y}&accesskey=dd10b55a50f0f392700587fc3090368d`,
    //   IR_SATELLITE_NOWCOAST: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/wwa_meteoceanhydro_longduration_hazards_time/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png32&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:102100&size={{width}}%2C{{height}}&bboxSR=102100&imageSR=102100&f=image",
    // IR_SATELLITE_NOWCOAST: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/sat_meteo_imagery_goes_time/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:3857&size={{width}}%2C{{height}}&bboxSR=3857&f=image",
    // IR_SATELLITE_NOWCOAST: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/obs_meteocean_insitu_sfc_time/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:3857&size={{width}}%2C{{height}}&bboxSR=3857&IMAGESR=3857&f=image",
    //WindGUSTS     IR_SATELLITE_NOWCOAST: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_windgust_offsets/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:3857&size={{width}}%2C{{height}}&bboxSR=3857&IMAGESR=3857&layers=show:19&f=image",
    //IR_SATELLITE_NOWCOAST: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_time/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:3857&size={{width}}%2C{{height}}&bboxSR=3857&IMAGESR=3857&f=image&layers={{layer}}&time={{time}}",
    //SNOW: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_dailymaxairtemp_offsets/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:3857&size={{width}}%2C{{height}}&bboxSR=3857&IMAGESR=3857&f=image",
    //PRECIP: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_dailymaxairtemp_offsets/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:3857&size={{width}}%2C{{height}}&bboxSR=3857&IMAGESR=3857&f=image",
    //IR_SATELLITE_NOWCOAST: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_dailymaxairtemp_offsets/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:3857&size={{width}}%2C{{height}}&bboxSR=3857&IMAGESR=3857&f=image",
    //IR_SATELLITE_NOWCOAST: "http://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_dailymaxairtemp_offsets/MapServer/export?&bbox={{minlon}},{{minlat}},{{maxlon}},{{maxlat}}&format=png&transparent=true&bgcolor=0xCCCCFE&SRS=EPSG:3857&size={{width}}%2C{{height}}&bboxSR=3857&IMAGESR=3857&f=image",

};

// THIS SECTION WILL APPEND CHECKBOXES TO THE SIDEBAR_MARKER_TOGGLES.HTML SECTION.
// ALL LAYER TYPES ARE "VECTOR" UNLESS IT'S THE VIS_SAT VECTORIZED DATA
window.onload =
    tileLayers.layer = {
        "vis_sat": layer_constructor("Satellite", 'vis_sat', tileLayers.baseURL.VIS_SATELLITE, "%Y%m%d_%H%M", 'raster'),
        "radar": layer_constructor("Radar", 'radar', tileLayers.baseURL.RADAR_COMP, "%Q", 'raster'),
        "hrrr_refl": layer_constructor("HRRR Reflectivity", 'hrrr_refl', tileLayers.baseURL.HRRR_REFL, "%Q", 'raster'),
        "modis_fires": layer_constructor("Modis Hotspots", 'modis_fires', tileLayers.baseURL.MODIS_FIRES, "%Q", 'raster'),
        "swe": layer_constructor("SWE", 'swe', tileLayers.baseURL.SWE, 'raster'),
        "ndfd_14d_temp": layer_constructor("14-Day Temp Forecast", 'ndfd_14d_temp', tileLayers.baseURL.NDFD_14D_TEMP, "%Q", 'raster'),
        "ndfd_14d_precip": layer_constructor("14-Day Precip Forecast", 'ndfd_14d_precip', tileLayers.baseURL.NDFD_14D_PRECIP, "%Q", 'raster'),
    }


function createValueMap(min, max) {
    const map = [...valueMap];

    for (let i = 0; i < 256; i++) {
        if (i <= min || i >= max) {
            map[i] = 0;
        }
    }
    return map;
}


async function getNDFDcolormap(elmt,rgn,sesn) {
    // 10-10-13 DTM will need to pass the grid type here too perhaps
    const month = new Date().getMonth()+1
    var sesn = '';
    switch(month){
        case 12:
        case 1:
        case 2:
            sesn = 'winter';
            break;
        case 3:
        case 4:
        case 5:
            sesn = 'spring';
            break;
        case 6:
        case 7:
        case 8:
            sesn = 'summer';
            break;
        case 9:
        case 10:
        case 11:
            sesn = 'fall';
            break;
    }

    const colormap = {};
    const response = await fetch('https://cors-anywhere.herokuapp.com/digital.weather.gov/scripts/get_colortable.php?&element='+ elmt + "&region=conus&season=" + sesn);
    const json = await response.json();
    for (var i=0;i<json.length;i++) {
        var rgbstr = json[i][1] + " " + json[i][2] + " " + json[i][3];
        colormap[rgbstr] = json[i][0];
    }
    return colormap
}


const vMap = createValueMap(...VALUE_RANGE);

function convertBounds(mapboxBounds) {
    const sw = mapboxBounds.getSouthWest();
    const ne = mapboxBounds.getNorthEast();

    return {
        southwest: {lng: sw.lng, lat: sw.lat},
        northeast: {lng: ne.lng, lat: ne.lat}
    };
}

function roundDate(timeStamp, totalDays, hrInc){
    timeStamp -= timeStamp % (24 * 60 * 60 * 1000);//subtract amount of time since midnight
    timeStamp += new Date().getTimezoneOffset() * 60 * 1000;//add on the timezone offset
    const outDate = new Date(timeStamp)
    outDate.setDate(outDate.getDate()+dayAdvance)
    return outDate;
}

async function getProductTimes(product){
    const times = [];
    // Times are to be loaded with the most recent time corresponding to the tile0. If the data are not a forecast
    // then the times will decrease with each tileselt (e.g. radar0 = timeT, radar1 = timeT-deltT)
    if (product.source_id === 'radar' || product.source_id === 'swe') {
        tileLayers.layer[product.source_id].fileTime = ['900913', '900913-m05m', '900913-m10m', '900913-m15m', '900913-m20m', '900913-m25m', '900913-m30m', '900913-m35m', '900913-m40m', '900913-m45m', '900913-m50m']
        const response = await fetch('https://mesonet.agron.iastate.edu/json/tms.json');
        const json = await response.json();
        const radar_info = json['services'].filter(item => item.id.includes('ridge_uscomp'))
        if (radar_info !== null){
            var formatTime = d3.utcParse("%Y-%m-%dT%H:%M:%S%Z")
            var most_recent = formatTime(radar_info[0].utc_valid)
            var most_recent_minutes = most_recent.getMinutes()
            for(i=0; i<=50; i+=5){
                // Time reported in milliseconds, so add i * one minute (in milliseconds) to the starting time.
                var scanTime = most_recent.setMinutes(most_recent_minutes) - i*60000
                times.push(scanTime)
            }
            tileLayers.layer[product.source_id].timestamps = times
        }
        // Radar is a special case where the fileNames do not have any time info associated with them. Instead of
        // returning the timestamps in the fileNames, we need to return the fileNames themselves (needed for animation)
        return [...tileLayers.layer[product.source_id].fileTime]
        //times.push('900913-m50m', '900913-m45m', '900913-m40m', '900913-m35m', '900913-m30m', '900913-m25m', '900913-m20m', '900913-m15m', '900913-m10m', '900913-m05m', '900913');
    }
    if (product.source_id === 'hrrr_refl') {
        //HRRR goe out 18 hrs (18*15*4=1080)
        for (var i = 0; i < (1080); i += 15) {
            var padTime = ("000" + i).slice(-4)
            times.push(padTime)
        }
        //return times
    }
    if (product.sourceType === 'ndfd') {
        const localt = new Date()
        const utcDate = new Date(localt.getTime() + localt.getTimezoneOffset() * 60000);
        utcDate.setHours(0)
        utcDate.setMinutes(0)
        const timeSlots = Math.floor(product.hour_range / product.hour_interval);
        const dateFormater = d3.timeFormat("%Y-%m-%dT%H:%M")
        for (let i = 0; i < timeSlots; i++) {
            const ftime = utcDate.setHours(utcDate.getHours() + (product.hour_interval))
            times.push(dateFormater(ftime))
        }
        times.reverse();
        //return times
    }
    if (product.source_id === 'vis_sat') {
        const response = await fetch('https://api.mapbox.com/tilesets/v1/smotley?access_token=sk.eyJ1Ijoic21vdGxleSIsImEiOiJja2NjYnZ4Z3AwMzZ2MnJwcWV0dmxrcDQzIn0.qheNdC3aHpFz1T1uPTKKug');
        const json = await response.json();
        const goes_obj = json.filter(item => item.name.includes('GOES17_'))
        for (let i = 0; i < goes_obj.length; i++) {
            const datetime = (goes_obj[i]['name']).split('GOES17_')[1]
            times.push(datetime)
            }
        //times.reverse();
    }
    //times.reverse();
    // I have absolutely no idea why we have to do the array this way. If we just say = time (i.e. not [time])
    // then the array will not copy over all the elements. The concat.apply removes the outer nested array
    // (i.e. the [["1,"2",...]] becomes ["1","2",...] )
    //tileLayers.layer[product.source_id].timestamps = []
    tileLayers.layer[product.source_id].timestamps = times
    //tileLayers.layer[product.source_id].timestamps = [].concat.apply([], tileLayers.layer[product.source_id].timestamps)
    return product.timestamps;
}

function colorFunctionVisSat(value, step = 0) {
    value = value - 75;
    if (value < 40) return 'transparent';

//  const scaled = Math.round((-value / VALUE_RANGE[1]) * 360) + 220; //For radar
    const scaled = Math.round((value / VALUE_RANGE[1]) * 360); //the value is some percentage of 360
    const finalValue = (scaled + step) % 360;
    return `rgba(${finalValue}, ${finalValue},${finalValue},1)`
}

function colorFunction(value, step = 0) {
    if (value === 0) return 'transparent';

//  const scaled = Math.round((-value / VALUE_RANGE[1]) * 360) + 220; //For radar
    const scaled = Math.round((value / VALUE_RANGE[1]) * 360); //the value is some percentage of 360
    const finalValue = (scaled + step) % 360;
    return `hsla(${finalValue}, 100%, 50%, 0.5)`;
}

function longTask() {
    return new ProgressPromise((resolve, reject, progress) => {
        setTimeout(() => progress(25), 250);
        setTimeout(() => progress(50), 500);
        setTimeout(() => progress(75), 750);
        setTimeout(resolve, 1000);
    });
}

const tileNames = {};

/**
 * Helper to create the texture canvas context.
 * @param  {string} source  the source of the tiles (e.g. 'Real Earth')
 * @param  {number} [height=1]  The height of the canvas
 * @param  {number} zoomForData  The height of the canvas
 * @return {CanvasRenderingContext2D}  The canvas 2d context
 */

export default class TileLoader{

    //const frames = 5;
    //const loader = new GridDataLoader();
    /**
     * Loads tiles from external source
     * @param  {object} loader  A new GridLoader object
     * @param  {int} frames  The number of frames
     * @return {Promise.<object>}  A Promise which resolves with GeoJSON data
     *   sampled from the grid
     */
    loadTiles(map,loader,product,texture, animate, frameNumber=null) {
        // Use this to find the top layer so that we can put highways and stuff above any layer:
        // see: https://docs.mapbox.com/mapbox-gl-js/example/geojson-layer-in-stack/ for more
        var layers = map.getStyle().layers;
        // Find the index of the first symbol layer in the map style
        var firstSymbolId;
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol') {
                firstSymbolId = layers[i].id;
                break;
                }
        }
        if (tileLayers.layer[product].source_id != 'vis_sat'){
                firstSymbolId = null
            }

        /*const progressBar = new ProgressPromise((resolve, reject, progress) => {
            setTimeout(() => progress(25), 250);
        })
        progressBar.progress(50)
        progressBar.progress(75)

        longTask()
            .progress(value => console.log(value + '%'))
            .then(() => console.log('Done'));
            */

        getProductTimes(tileLayers.layer[product]).then(timeStampsClone => {
            var tileNames = [...timeStampsClone]
            var frames = 1

            // Set max value for timeline scrubber.
            $('#timelineScrubber')[0].max = tileNames.length - 1

            //When user clicks to add a layer, set the scrubber value to the max value.
            $('#timelineScrubber')[0].value = tileNames.length - 1
            if (animate === true){
                frames = tileNames.length
            }
            // Note: We already got the tile time's from Iowa state's site. But the tiles have static names.
            //tileNames.splice(0, tileNames.length - frames)
            for (let i = 0; i < frames; i++) {
                // The request to load frames is coming from the slider. So only load tiles for that specific frame
                if (frameNumber!== null){
                    i = frameNumber
                    console.log(frameNumber)
                }
                const url = tileLayers.layer[product]['URL'](tileNames,i)
                //The first image will be visible, all others will be transparent until animation starts
                if (i > 0) texture = colorTexture.create([undefined], colorFunctionVisSat);
                try{
                    //map.getSource(tileLayers.layer[product].source_id + i)
                    map.addSource(tileLayers.layer[product].source_id + i, {
                        "type": tileLayers.layer[product].sourceType,               // e.g "raster", "vector"
                        "tiles": [url],
                        "tileSize": tileLayers.layer[product].tileSize              // rasters are 256, vectors 512
                    });
                    console.log("added Source: ", tileLayers.layer[product].source_id + i)
                }
                catch(err){
                    //If source already exists, update the url anyway
                    map.getSource(tileLayers.layer[product].source_id + i).tiles = [url];
                    console.log(err, " Adding Layer Back to map")
                }
                    map.addLayer({
                        "id": tileLayers.layer[product].layer_id + i,
                        "type": tileLayers.layer[product].layerType,
                        "paint": tileLayers.layer[product].paint(texture),
                        "source": tileLayers.layer[product].source_id + i,
                        "source-layer": tileLayers.layer[product].sourceLayer,
                        "minzoom": 0,
                        "maxzoom": tileLayers.layer[product].maxzoom
                    },
                        firstSymbolId
                    );
                var prettyTime = this.range_slider_times(product)
                dateSlider.innerText = prettyTime[i]
            }

            if (animate===true){
                this.animateTiles(map, product, tileNames.length, true)
            }
        })
        if (tileLayers.layer[product].sourceType === 'ndfd'){
            getNDFDcolormap(tileLayers.layer[product].ndfd_name).then(colorkey => {
                colormap = colorkey
            })
        }
    };

    removeTiles(map,product){
        const all_layers = map.getStyle().layers;
        all_layers.forEach(layer => {
            if (layer.id.includes(tileLayers.layer[product].layer_id)){
                map.removeLayer(layer.id)
            }
        });
    }

    make3d(map,url,loader,frames,bbox,zoomNeeded,modelRes,idNum) {
        for (let i = 0; i < frames; i++) {
            map.addSource('raster-json' + idNum, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            map.addLayer({
                type: 'fill-extrusion',
                source: 'raster-json' + idNum,
                id: 'circle-layer' + idNum,
                paint: {
                    // See the Mapbox Style Spec for details on property functions
                    // https://www.mapbox.com/mapbox-gl-style-spec/#types-function
                    'fill-extrusion-height': {
                        // Get fill-extrusion-height from the source 'height' property.
                        'property': 'height',
                        'type': 'identity'
                    },
                    'fill-extrusion-color': {
                        // Get the fill-extrusion-color from the source 'color' property.
                        'property': 'color',
                        'type': 'identity'
                    },
                    'fill-extrusion-base': {
                        // Get fill-extrusion-base from the source 'base_height' property.
                        'property': 'base',
                        'type': 'identity'
                    },
                    'fill-extrusion-opacity': 0.5,
                    "fill-extrusion-opacity-transition": {
                        "duration": 0
                    }
                }
            });


            //map.setLight({color: "#6ef", intensity: 0.5, position: [1.15, 135, 45]});
            const lngLat = map.getCenter();
            //const [x, y, z] = tilebelt.pointToTile(lngLat.lng, lngLat.lat, Math.floor(map.getZoom()));
            //const url = 'http://realearth.ssec.wisc.edu/tiles/' + product + '/' + yymmdd + '/' + hhmm + '/' + z + '/' + x + '/' + y + '.png';
            //const bbox = tilebelt.tileToBBOX([x, y, z]);
            const options = {
                bbox,
                bounds: convertBounds(map.getBounds()),
                samplingFactor: 30,
                zoom: zoomNeeded,
            };
            const query = _.throttle(() => {
                loader
                    .queryData([{url, weatherParameter: 'color', imageType: 'grayscale'}], options)
                    .then(geojson => {
                        for (let j = 0; j < geojson.features.length; j++) {
                            const feature = geojson.features[j];
                            const {color} = feature.properties.weatherParameters;

                            if (color > 80) {
                                feature.properties.color = colorFunction(color);
                                feature.properties.height = color * 300;
                                feature.properties.base = color * 250;
                            } else {
                                geojson.features.splice(j, 1);
                                j--
                            }
                        }

                        map.getSource('raster-json' + idNum).setData(geojson);
                        //make sure the 3d layer is on top
                        map.moveLayer('circle-layer' + idNum)
                    });
            }, 100);
            query();
        }
    }

    animateTiles(map,product,frames,animation) {
        if (animation === true){
            imgLooper = setInterval(function(){
                loop()
            },300)
        }
        if (animation === false){
            clearInterval(imgLooper)
            return tileLayers.layer[product]
        }
        var product_times = tileLayers.layer[product].timestamps
        var prettyTime = this.range_slider_times(product)
        var frameCount = product_times.length;
        var forecastValue = tileLayers.layer[product].forecastValue
        var frame = 0
        if (forecastValue){frame = frameCount - 1;}
        var frame_displaying = 0
        var tile_id = tileLayers.layer[product].layer_id
        var opacitySlider = document.getElementById('opacity_slider');
        $('#timelineScrubber')[0].max = frameCount - 1
        function loop(){
            var visible_layer_opacity = 0.7
            if (typeof opacitySlider.value !== 'undefined') {
                visible_layer_opacity = parseInt(opacitySlider.value, 10) / 100
            }
            //If this were a polygon, we'd use "fill-opacity" instead of "raster-opacity'
            map.setPaintProperty(tile_id + frame_displaying, 'raster-opacity-transition', {duration:0, delay:0});
            map.setPaintProperty(tile_id + frame_displaying, 'raster-opacity', 0);

            // ANIMATE PRESENT --> FUTURE.
            if (forecastValue){
                frame = (frame + 1) % frameCount;
                frame_displaying = frame
            }
            // ANIMATE PAST --> PRESENT.
            else {
                frame += 1
                frame_displaying = (frame - frameCount) * -1
                if (frame > (frameCount - 1)) {frame = 0}
            }
            map.setPaintProperty(tile_id + frame_displaying, 'raster-opacity', visible_layer_opacity);
            $('#timelineScrubber')[0].value = frame
            dateSlider.innerText = prettyTime[(frameCount-1)-frame]
        }

    }

    range_slider_times(product){
        var product_times = tileLayers.layer[product].timestamps
        var product_time_format = tileLayers.layer[product].timeFormat
        return timeFormater(product_times, product_time_format)
    }

}

function timeFormater(product_times, product_time_format){
    var pretty_times = []
    var formatTime = d3.utcParse(product_time_format)
    var prettyFormat = d3.timeFormat("%a %I:%M%p")
    for(const t in product_times){
        var dateObj = formatTime(product_times[t])
        var dateString = prettyFormat(dateObj)
        pretty_times.push(dateString)
    }
    return pretty_times
}