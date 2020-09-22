
export default function(onLoad, mapboxgl = window.mapboxgl, options) {
  const container = document.createElement('div');
  const progressBar = document.createElement('div')
  container.classList.add('map', 'container');
  progressBar.classList.add('progressBar', 'bar3')

  document.body.appendChild(container);
  document.body.appendChild(progressBar)

    mapboxgl.accessToken = 'pk.eyJ1Ijoic21vdGxleSIsImEiOiJuZUVuMnBBIn0.xce7KmFLzFd9PZay3DjvAA';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v9',
        zoom: 6,
        center: [-90.5447, 32.6892]
    });

  map.on('load', () => onLoad(map));
}
