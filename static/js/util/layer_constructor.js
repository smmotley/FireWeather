function MBLAYER(layerOptions){
    //layerOptions is the object literal that holds all the options
    const fileTime = (layerOptions.fileTime) ? layerOptions.fileTime : null;
    const nowCoastLayerNum = (layerOptions.nowCoastLayerNum) ? layerOptions.nowCoastLayerNum : null;
    //this.source_type=layerOptions.source_type;
    this.URL=layerOptions.URL;
    this.maxzoom=layerOptions.maxzoom;
    this.ndfd_name = layerOptions.ndfd_name;
    this.nowCoastLayerNum = nowCoastLayerNum;
    this.fileTime = fileTime;
    this.source_id=layerOptions.source_id;
    this.modelRes=layerOptions.modelRes;
    this.hour_range=layerOptions.hour_range;
    this.hour_interval=layerOptions.hour_interval;
    this.timestamps=layerOptions.timestamps;
    this.timeFormat=layerOptions.timeFormat
    this.ssecID=layerOptions.ssecID;
    this.layer_id=layerOptions.layer_id;
    this.paint=layerOptions.paint;
    this.layerType=layerOptions.layerType;
    this.sourceType=layerOptions.sourceType;
    this.sourceLayer=layerOptions.sourceLayer;
    this.tileSize=layerOptions.tileSize;
    this.z=layerOptions.zindex;
    this.currentValue=layerOptions.currentValue;
    this.forecastValue=layerOptions.forecastValue;
    this.defaultOptions=layerOptions.defaultOptions;
    this.autoRefresh=layerOptions.autoRefresh;
    this.sortOrder=layerOptions.sortOrder;
    this.defaultOpacity=layerOptions.defaultOpacity;
    this.overlay=[];
    this.title=layerOptions.title||"";
    this.refreshMinutes=layerOptions.refreshMinutes;
    this.safeOpacity=this.defaultOpacity;
}

export default function layer_constructor(button_name, layer_id, layerurl, layerTimeFormat, layertype){
    var layer_selection_div = document.getElementById("Layer_Selection")
        layer_selection_div.innerHTML +=
            `<li class="maplayer-toggle">
                <label  for="${layer_id}">
                    <input name="${layer_id}" data-do="${layer_id}" class="filled-in map-toggle" id="${layer_id}" type="checkbox" />
                    <span>${button_name}
                        <i class="material-icons">brightness_5</i>
                    </span>
                  </label>
            </li>`

    //if (maxzoom == null) { maxzoom = 22}
    let maxzoom = 22
    const newlayer = new MBLAYER({
        //source_type: 'mbox_smotley',
        source_id:layer_id,
        layer_id:layer_id+'-tiles',
        URL:layerurl,
        timestamps: null,
        timeFormat: layerTimeFormat,
        //layerType: 'data-driven-raster',
        layerType: layertype,
        sourceType: layertype,     //source type will be 'raster' (same as layerType), if it's a raster
        sourceLayer: "empty",
        tileSize: 256,
        modelRes: 2000,
        minzoom: 0,
        maxzoom: maxzoom,
        //paint: (texture) => ({'raster-lookup-texture': texture}),
        paint: () => ({
            'raster-opacity': 0.5,
                'raster-opacity-transition': {
                'duration': 0
            }
        }),
        currentValue:false,
        forecastValue:false,
        zindex:5,
        defaultOptions:null,
        defaultOpacity:50,
        /*safeOpacity:50,*/
        autoRefresh:true,
        refreshMinutes:5,
        sortOrder:95,
        title:""
    })

    // This case is specifically for coloring the VIS_SAT data IF the tiles are vectorized.
    if (layertype === "vector"){
        newlayer.paint = () => ({
          "fill-outline-color": "hsla(0, 0%, 0%, 0)",
          'fill-opacity': 0.7,
          "fill-color": [
            "rgb",
            ["case", ["<",
              ["%", ["/", ["get", "raster_val"], 65536], 256], 255],  //if raster_val/65536 % 256 < 255 Then:
              ["%", ["/", ["get", "raster_val"], 65536], 256],       // red = raster_val/65536 % 256
              255],                                                  // else red = 255
            ["case", ["<",
              ["%", ["/", ["get", "raster_val"], 256], 256], 255],
              ["%", ["/", ["get", "raster_val"], 256], 256],
              255],
            ["case", ["<",
              ["%", ["get", "raster_val"], 256], 255],
              ["%", ["get", "raster_val"], 256],
              255]
          ]
        })
        newlayer.tileSize = 512
        newlayer.layerType = "fill"
        newlayer.sourceLayer = "goes17_fire"
    }

    return newlayer
}