
export default function createMap(onLoad, mapboxgl = window.mapboxgl) {
    let map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v10',
        center: [-120.5, 39.05],
        zoom: 6
    });
    map.on('load', () => onLoad(map))
}

export function createGeoLocationMap(onLoad, mapboxgl = window.mapboxgl) {
    let map = new mapboxgl.Map({
        container: 'map_geolocation',
        style: 'mapbox://styles/mapbox/streets-v10',
        center: [-120.5, 39.05],
        zoom: 9
    });
    map.on('load', () => onLoad(map))
}