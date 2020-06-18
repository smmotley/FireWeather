//import * as d3 from './static/d3.min.js';
import TileLoader from './TileLoader.js';

/*

    %a - abbreviated weekday name.*
    %A - full weekday name.*
    %b - abbreviated month name.*
    %B - full month name.*
    %c - the locale’s date and time, such as %x, %X.*
    %d - zero-padded day of the month as a decimal number [01,31].
    %e - space-padded day of the month as a decimal number [ 1,31]; equivalent to %_d.
    %f - microseconds as a decimal number [000000, 999999].
    %H - hour (24-hour clock) as a decimal number [00,23].
    %I - hour (12-hour clock) as a decimal number [01,12].
    %j - day of the year as a decimal number [001,366].
    %m - month as a decimal number [01,12].
    %M - minute as a decimal number [00,59].
    %L - milliseconds as a decimal number [000, 999].
    %p - either AM or PM.*
    %Q - milliseconds since UNIX epoch.
    %s - seconds since UNIX epoch.
    %S - second as a decimal number [00,61].
    %u - Monday-based (ISO 8601) weekday as a decimal number [1,7].
    %U - Sunday-based week of the year as a decimal number [00,53].
    %V - ISO 8601 week of the year as a decimal number [01, 53].
    %w - Sunday-based weekday as a decimal number [0,6].
    %W - Monday-based week of the year as a decimal number [00,53].
    %x - the locale’s date, such as %-m/%-d/%Y.*
    %X - the locale’s time, such as %-I:%M:%S %p.*
    %y - year without century as a decimal number [00,99].
    %Y - year with century as a decimal number.
    %Z - time zone offset, such as -0700, -07:00, -07, or Z.
    %% - a literal percent sign (%).

 */

function roundDate(timeStamp, dayAdvance){
    timeStamp -= timeStamp % (24 * 60 * 60 * 1000);//subtract amount of time since midnight
    timeStamp += new Date().getTimezoneOffset() * 60 * 1000;//add on the timezone offset
    const outDate = new Date(timeStamp)
    outDate.setDate(outDate.getDate()+dayAdvance)
    return outDate;
}

function timeCleaner(){

}

function setupDom(map) {
    const brushContainer = document.createElement('div');
    const playButton = document.createElement('button');

    const svgElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg'
    );

    brushContainer.classList.add('brush-container');
    svgElement.classList.add('brush');
    playButton.classList.add('play-button');

    playButton.innerHTML = 'play_arrow';

    playButton.classList.add('material-icons');
    playButton.classList.add('toggle-button');

    brushContainer.appendChild(svgElement);
    brushContainer.appendChild(playButton);
    document.body.appendChild(brushContainer);


    let layerAnimating = false;
    const tileSet = new TileLoader();
    playButton.addEventListener('click', () => {

        playButton.classList.toggle('play-button--toggled');

        if (layerAnimating) {
            playButton.innerHTML = 'play_arrow';
            tileSet.animateTiles(map,5,false)
        } else {
            playButton.innerHTML = 'pause';
            tileSet.animateTiles(map,5,true)
        }

        layerAnimating = !layerAnimating;
    });

}

function createHandler(scaleValue, onSelect) {
    return () => {
        const selection = d3.event.selection;
        const [min, max] = selection.map(scaleValue).map(Math.floor);
        onSelect(min, max);
    };
}

export default function(onSelect, valueRange, colorFunction,map) {
    setupDom(map);

    const svg = d3
        .select('svg')
        .attr('class', 'brush')
        .attr('width', window.innerWidth)
        .attr('height', 100);
    const width = svg.attr('width');
    const height = svg.attr('height');

    var margin = {top: 50, right: 50, bottom: 0, left: 50}

    const startDate = roundDate(new Date(), 0);
    const endDate = roundDate(new Date(), 7);

    const dateFormater = d3.timeFormat("%a %I %p")

    ////////// slider //////////

    var moving = false;
    var currentValue = 0;
    var targetValue = width;

    var playButton = d3.select("#play-button");

    var x = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, targetValue])
        .clamp(true);


    var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + height / 5 + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-inset")
        .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function () {
                slider.interrupt();
            })
            .on("start drag", function () {
                currentValue = d3.event.x;
                update(x.invert(currentValue));
            })
        );

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(x.ticks(10))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function (d) {
            return dateFormater(d);
        });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    var label = slider.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(dateFormater(startDate))
        .attr("transform", "translate(0," + (-25) + ")")
}

////////// plot //////////
/*
var dataset;

var plot = svg.append("g")
    .attr("class", "plot")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("circles.csv", prepare, function(data) {
    dataset = data;
    drawPlot(dataset);

    playButton
        .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                // timer = 0;
                button.text("Play");
            } else {
                moving = true;
                timer = setInterval(step, 100);
                button.text("Pause");
            }
            console.log("Slider moving: " + moving);
        })
})

function prepare(d) {
    d.id = d.id;
    d.date = parseDate(d.date);
    return d;
}

function step() {
    update(x.invert(currentValue));
    currentValue = currentValue + (targetValue/151);
    if (currentValue > targetValue) {
        moving = false;
        currentValue = 0;
        clearInterval(timer);
        // timer = 0;
        playButton.text("Play");
        console.log("Slider moving: " + moving);
    }
}

function drawPlot(data) {
    var locations = plot.selectAll(".location")
        .data(data);

    // if filtered dataset has more circles than already existing, transition new ones in
    locations.enter()
        .append("circle")
        .attr("class", "location")
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", height/2)
        .style("fill", function(d) { return d3.hsl(d.date/1000000000, 0.8, 0.8)})
        .style("stroke", function(d) { return d3.hsl(d.date/1000000000, 0.7, 0.7)})
        .style("opacity", 0.5)
        .attr("r", 8)
        .transition()
        .duration(400)
        .attr("r", 25)
        .transition()
        .attr("r", 8);

    // if filtered dataset has less circles than already existing, remove excess
    locations.exit()
        .remove();
}

function update(h) {
    // update position and text of label according to slider scale
    handle.attr("cx", x(h));
    label
        .attr("x", x(h))
        .text(formatDate(h));

    // filter data set and redraw plot
    var newData = dataset.filter(function(d) {
        return d.date < h;
    })
    drawPlot(newData);
}
}
/*
export default function(onSelect, valueRange, colorFunction) {
    setupDom();

    const svg = d3
        .select('svg')
        .attr('class', 'brush')
        .attr('width', window.innerWidth)
        .attr('height', 100);
    const width = svg.attr('width');
    const height = svg.attr('height');
    const x = d3.scaleBand().rangeRound(valueRange);
    const y = d3.scaleLinear().rangeRound([0, height]);
    const g = svg.append('g');
    const data = _.range(...valueRange);
    const barWidth = width / data.length;

    x.domain(valueRange);
    y.domain([0, 1]);

    const scale = Math.abs(valueRange[1] - valueRange[0]);
    const scaleValue = val => val / width * scale;
    const brushHandler = createHandler(scaleValue, onSelect);

    g
        .selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (_, index) => index * barWidth)
        .attr('y', 1)
        .attr('fill', value => colorFunction(value - 50))
        .attr('width', barWidth)
        .attr('height', height);

    const brush = d3
        .brushX()
        .extent([[0, 1], [width, height - 1]])
        .on('brush end', brushHandler);

    svg
        .append('g')
        .call(brush)
        .call(brush.move, x.range());
}
*/