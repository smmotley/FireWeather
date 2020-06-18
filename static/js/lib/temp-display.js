export default class TempDisplay {
    constructor() {
        this.element = document.createElement('div');

        this.element.classList.add('temp-display');
        this.element.style.cssText = 'z-index: 10; color: black; position: absolute';
        document.querySelector('.mapboxgl-map').appendChild(this.element);
    }

    update(min, max) {
        this.element.textContent = `Temperature: [${min}, ${max}] °C`;
    }
}