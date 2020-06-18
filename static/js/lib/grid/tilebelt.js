
var d2r = Math.PI / 180,
    r2d = 180 / Math.PI;
var originShift = 2 * Math.PI * 6378137 / 2.0

export function initialResolution (tileSize) {
    tileSize = tileSize || 256
    return 2 * Math.PI * 6378137 / tileSize
}
/**
 * Wrap Tile -- Handles tiles which crosses the 180th meridian or 90th parallel
 *
 * @param {[number, number, number]} tile Tile
 * @param {number} zoom Zoom Level
 * @returns {[number, number, number]} Wrapped Tile
 * @example
 * globalMercator.wrapTile([0, 3, 2])
 * //= [0, 3, 2] -- Valid Tile X
 * globalMercator.wrapTile([4, 2, 2])
 * //= [0, 2, 2] -- Tile 4 does not exist, wrap around to TileX=0
 */
export function wrapTile (tile) {
    var tx = tile[0]
    var ty = tile[1]
    var zoom = tile[2]

    // Maximum tile allowed
    // zoom 0 => 1
    // zoom 1 => 2
    // zoom 2 => 4
    // zoom 3 => 8
    var maxTile = Math.pow(2, zoom)

    // Handle Tile X
    tx = tx % maxTile
    if (tx < 0) tx = tx + maxTile

    return [tx, ty, zoom]
}


/**
 * Get the bbox of a tile
 *
 * @name tileToBBOX
 * @param {Array<number>} tile
 * @returns {Array<number>} bbox
 * @example
 * var bbox = tileToBBOX([5, 10, 10])
 * //=bbox
 */
export function tileToBBOX(tile) {
    var e = tile2lon(tile[0] + 1, tile[2]);
    var w = tile2lon(tile[0], tile[2]);
    var s = tile2lat(tile[1] + 1, tile[2]);
    var n = tile2lat(tile[1], tile[2]);
    return {
        northeast: {latitude: n, longitude: e},
        southwest: {latitude: s, longitude: w}
    };
    //return [w, s, e, n];
}

/**
 * Get a geojson representation of a tile
 *
 * @name tileToGeoJSON
 * @param {Array<number>} tile
 * @returns {Feature<Polygon>}
 * @example
 * var poly = tileToGeoJSON([5, 10, 10])
 * //=poly
 */
function tileToGeoJSON(tile) {
    var bbox = tileToBBOX(tile);
    var poly = {
        type: 'Polygon',
        coordinates: [[
            [bbox[0], bbox[1]],
            [bbox[0], bbox[3]],
            [bbox[2], bbox[3]],
            [bbox[2], bbox[1]],
            [bbox[0], bbox[1]]
        ]]
    };
    return poly;
}

function tile2lon(x, z) {
    return x / Math.pow(2, z) * 360 - 180;
}

function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return r2d * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/**
 * Get the tile for a point at a specified zoom level
 *
 * @name pointToTile
 * @param {number} lon
 * @param {number} lat
 * @param {number} z
 * @returns {Array<number>} tile
 * @example
 * var tile = pointToTile(1, 1, 20)
 * //=tile
 */
export function pointToTile(lon, lat, z) {
    var tile = pointToTileFraction(lon, lat, z);
    tile[0] = Math.floor(tile[0]);
    tile[1] = Math.floor(tile[1]);
    return tile;
}

/**
 * Get the 4 tiles one zoom level higher
 *
 * @name getChildren
 * @param {Array<number>} tile
 * @returns {Array<Array<number>>} tiles
 * @example
 * var tiles = getChildren([5, 10, 10])
 * //=tiles
 */
function getChildren(tile) {
    return [
        [tile[0] * 2, tile[1] * 2, tile[2] + 1],
        [tile[0] * 2 + 1, tile[1] * 2, tile[2 ] + 1],
        [tile[0] * 2 + 1, tile[1] * 2 + 1, tile[2] + 1],
        [tile[0] * 2, tile[1] * 2 + 1, tile[2] + 1]
    ];
}

/**
 * Get the tile one zoom level lower
 *
 * @name getParent
 * @param {Array<number>} tile
 * @returns {Array<number>} tile
 * @example
 * var tile = getParent([5, 10, 10])
 * //=tile
 */
function getParent(tile) {
    return [tile[0] >> 1, tile[1] >> 1, tile[2] - 1];
}

function getSiblings(tile) {
    return getChildren(getParent(tile));
}

/**
 * Get the 3 sibling tiles for a tile
 *
 * @name getSiblings
 * @param {Array<number>} tile
 * @returns {Array<Array<number>>} tiles
 * @example
 * var tiles = getSiblings([5, 10, 10])
 * //=tiles
 */
function hasSiblings(tile, tiles) {
    var siblings = getSiblings(tile);
    for (var i = 0; i < siblings.length; i++) {
        if (!hasTile(tiles, siblings[i])) return false;
    }
    return true;
}

/**
 * Check to see if an array of tiles contains a particular tile
 *
 * @name hasTile
 * @param {Array<Array<number>>} tiles
 * @param {Array<number>} tile
 * @returns {boolean}
 * @example
 * var tiles = [
 *     [0, 0, 5],
 *     [0, 1, 5],
 *     [1, 1, 5],
 *     [1, 0, 5]
 * ]
 * hasTile(tiles, [0, 0, 5])
 * //=boolean
 */
function hasTile(tiles, tile) {
    for (var i = 0; i < tiles.length; i++) {
        if (tilesEqual(tiles[i], tile)) return true;
    }
    return false;
}

/**
 * Check to see if two tiles are the same
 *
 * @name tilesEqual
 * @param {Array<number>} tile1
 * @param {Array<number>} tile2
 * @returns {boolean}
 * @example
 * tilesEqual([0, 1, 5], [0, 0, 5])
 * //=boolean
 */
function tilesEqual(tile1, tile2) {
    return (
        tile1[0] === tile2[0] &&
        tile1[1] === tile2[1] &&
        tile1[2] === tile2[2]
    );
}

/**
 * Get the quadkey for a tile
 *
 * @name tileToQuadkey
 * @param {Array<number>} tile
 * @returns {string} quadkey
 * @example
 * var quadkey = tileToQuadkey([0, 1, 5])
 * //=quadkey
 */
function tileToQuadkey(tile) {
    var index = '';
    for (var z = tile[2]; z > 0; z--) {
        var b = 0;
        var mask = 1 << (z - 1);
        if ((tile[0] & mask) !== 0) b++;
        if ((tile[1] & mask) !== 0) b += 2;
        index += b.toString();
    }
    return index;
}

/**
 * Get the tile for a quadkey
 *
 * @name quadkeyToTile
 * @param {string} quadkey
 * @returns {Array<number>} tile
 * @example
 * var tile = quadkeyToTile('00001033')
 * //=tile
 */
function quadkeyToTile(quadkey) {
    var x = 0;
    var y = 0;
    var z = quadkey.length;

    for (var i = z; i > 0; i--) {
        var mask = 1 << (i - 1);
        var q = +quadkey[z - i];
        if (q === 1) x |= mask;
        if (q === 2) y |= mask;
        if (q === 3) {
            x |= mask;
            y |= mask;
        }
    }
    return [x, y, z];
}

/**
 * Get the smallest tile to cover a bbox
 *
 * @name bboxToTile
 * @param {Array<number>} bbox
 * @returns {Array<number>} tile
 * @example
 * var tile = bboxToTile([ -178, 84, -177, 85 ])
 * //=tile
 */
export function bboxToTile(bboxCoords) {
    var min = pointToTile(bboxCoords[0], bboxCoords[1], 32);
    var max = pointToTile(bboxCoords[2], bboxCoords[3], 32);
    var bbox = [min[0], min[1], max[0], max[1]];

    var z = getBboxZoom(bbox);
    if (z === 0) return [0, 0, 0];
    var x = bbox[0] >>> (32 - z);
    var y = bbox[1] >>> (32 - z);
    return [x, y, z];
}

function getBboxZoom(bbox) {
    var MAX_ZOOM = 28;
    for (var z = 0; z < MAX_ZOOM; z++) {
        var mask = 1 << (32 - (z + 1));
        if (((bbox[0] & mask) !== (bbox[2] & mask)) ||
            ((bbox[1] & mask) !== (bbox[3] & mask))) {
            return z;
        }
    }

    return MAX_ZOOM;
}

/**
 * Get the precise fractional tile location for a point at a zoom level
 *
 * @name pointToTileFraction
 * @param {number} lon
 * @param {number} lat
 * @param {number} z
 * @returns {Array<number>} tile fraction
 * var tile = pointToTileFraction(30.5, 50.5, 15)
 * //=tile
 */
export function pointToTileFraction(lon, lat, z) {
    var sin = Math.sin(lat * d2r),
        z2 = Math.pow(2, z),
        x = z2 * (lon / 360 + 0.5),
        y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);

    // Wrap Tile X
    x = x % z2
    if (x < 0) x = x + z2
    return [x, y, z];
}

export function tileFractionToLatLon(x,y,z){
    var z2 = Math.pow(2, z),
        n = Math.PI - 2 * Math.PI * y / z2,
        lon = x / z2 * 360 - 180,
        lat = r2d * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
        return [lon,lat]
}

/**
 * Converts TMS Tile to bbox in Meters coordinates.
 * FROM https://github.com/DenisCarriere/global-mercator/blob/master/index.js
 * @param {Tile} tile Tile [x, y, zoom]
 * @param {number} x TMS Tile X
 * @param {number} y TMS Tile Y
 * @param {number} zoom Zoom level
 * @param {number} [tileSize=256] Tile size
 * @param {boolean} [validate=true] validates Tile
 * @returns {BBox} bbox extent in [minX, minY, maxX, maxY] order
 * @example
 * var bbox = globalMercator.tileToBBoxMeters([6963, 5003, 13])
 * //=[ 14025277.4, 4437016.6, 14030169.4, 4441908.5 ]
 */
export function tileToBBoxMeters (tile, tileSize, validate) {
    validateTile(tile, validate)

    tileSize = tileSize || 256
    var tx = tile[0]
    var ty = tile[1]
    var zoom = tile[2]
    var min = pixelsToMeters([tx * tileSize, ty * tileSize, zoom])
    var max = pixelsToMeters([(tx + 1) * tileSize, (ty + 1) * tileSize, zoom])
    return [min[0], min[1], max[0], max[1]]
}

/**
 * Converts Pixels coordinates to Meters coordinates.
 *
 * @param {Pixels} pixels Pixels [x, y, zoom]
 * @param {number} [tileSize=256] Tile size
 * @returns {Meters} Meters coordinates
 * @example
 * var meters = globalMercator.pixelsToMeters([1782579, 1280877, 13])
 * //=[ 14026252.0, 4439099.5 ]
 */
export function pixelsToMeters (pixels, tileSize) {
    var px = pixels[0]
    var py = pixels[1]
    var zoom = pixels[2]
    var res = resolution(zoom, tileSize)
    var mx = px * res - originShift
    var my = py * res - originShift
    mx = Number(mx.toFixed(1))
    my = Number(my.toFixed(1))
    return [mx, my]
}


/**
 * Retrieve resolution based on zoom level
 *
 * @private
 * @param {number} zoom zoom level
 * @param {number} [tileSize=256] Tile size
 * @returns {number} resolution
 * @example
 * var res = globalMercator.resolution(13)
 * //=19.109257071294063
 */
export function resolution (zoom, tileSize) {
    return initialResolution(tileSize) / Math.pow(2, zoom)
}

/**
 * Validates TMS Tile.
 *
 * @param {Tile} tile Tile [x, y, zoom]
 * @param {boolean} [validate=true] validates Tile
 * @throws {Error} Will throw an error if TMS Tile is not valid.
 * @returns {Tile} TMS Tile
 * @example
 * globalMercator.validateTile([60, 80, 12])
 * //=[60, 80, 12]
 * globalMercator.validateTile([60, -43, 5])
 * //= Error: Tile <y> must not be less than 0
 * globalMercator.validateTile([25, 60, 3])
 * //= Error: Illegal parameters for tile
 */
export function validateTile (tile, validate) {
    var tx = tile[0]
    var ty = tile[1]
    var zoom = tile[2]
    if (validate === false) return tile
    if (zoom === undefined || zoom === null) throw new Error('<zoom> is required')
    if (tx === undefined || tx === null) throw new Error('<x> is required')
    if (ty === undefined || ty === null) throw new Error('<y> is required')

    // Adjust values of tiles to fit within tile scheme
    zoom = validateZoom(zoom)
    tile = wrapTile(tile)

    // // Check to see if tile is valid based on the zoom level
    // // Currently impossible to hit since WrapTile handles this error
    // // will keep this test commented out in case it doesnt handle it
    // var maxCount = Math.pow(2, zoom)
    // if (tile[0] >= maxCount || tile[1] >= maxCount) throw new Error('Illegal parameters for tile')
    return tile
}

/**
 * Validates Zoom level
 *
 * @param {number} zoom Zoom level
 * @param {boolean} [validate=true] validates Zoom level
 * @throws {Error} Will throw an error if zoom is not valid.
 * @returns {number} zoom Zoom level
 * @example
 * globalMercator.validateZoom(12)
 * //=12
 * globalMercator.validateZoom(-4)
 * //= Error: <zoom> cannot be less than 0
 * globalMercator.validateZoom(32)
 * //= Error: <zoom> cannot be greater than 30
 */
export function validateZoom (zoom) {
    if (zoom === false) return zoom
    if (zoom === undefined || zoom === null) { throw new Error('<zoom> is required') }
    if (zoom < 0) { throw new Error('<zoom> cannot be less than 0') }
    if (zoom > 32) { throw new Error('<zoom> cannot be greater than 32') }
    return zoom
}

/**
 * Converts Google (XYZ) Tile to bbox in Meters coordinates.
 *
 * @param {Google} google Google [x, y, zoom]
 * @returns {BBox} bbox extent in [minX, minY, maxX, maxY] order
 * @example
 * var bbox = globalMercator.googleToBBoxMeters([6963, 3188, 13])
 * //=[ 14025277.4, 4437016.6, 14030169.4, 4441908.5 ]
 */
export function googleToBBoxMeters (google) {
    var Tile = googleToTile(google)
    return tileToBBoxMeters(Tile)
}

/**
 * Converts Google (XYZ) Tile to TMS Tile.
 *
 * @param {Google} google Google [x, y, zoom]
 * @returns {Tile} TMS Tile
 * @example
 * var tile = globalMercator.googleToTile([6963, 3188, 13])
 * //=[ 6963, 5003, 13 ]
 */
export function googleToTile (google) {
    var x = google[0]
    var y = google[1]
    var zoom = google[2]
    var tx = x
    var ty = Math.pow(2, zoom) - y - 1
    return [tx, ty, zoom]
}



