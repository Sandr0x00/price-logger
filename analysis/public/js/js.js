/* global $, d3, window, XMLHttpRequest, setInterval, console */

// prototypes
Array.prototype.getMin = function(attrib) {
    return this.reduce(function(prev, curr){
        return prev[attrib] < curr[attrib] ? prev : curr;
    });
};
 Array.prototype.getMax = function(attrib) {
    return this.reduce(function(prev, curr){
        return prev[attrib] > curr[attrib] ? prev : curr;
    });
};

// svg
// const margin = {top: 50, right: 50, bottom: 50, left: 50};
// const width = window.innerWidth - margin.left - margin.right - 50;
// const height = window.innerHeight - margin.top - margin.bottom - 150;
// const width = 960;
// const height = 500;
const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

const height = 600;
const width = 900;
const margin = { left: 60, top: 10, right: 60, bottom: 30 };

const getRatio = side => (margin[side] / width) * 100 + '%';

const marginRatio = {
  left: getRatio('left'),
  top: getRatio('top'),
  right: getRatio('right'),
  bottom: getRatio('bottom')
}

const svg = d3.select('#price-chart').append('svg')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    // .style('margin', marginRatio.top + ' ' + marginRatio.right + ' ' + marginRatio.bottom + ' ' + marginRatio.left)
    .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom)
    )
    .append('g')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // .attr('viewBox', '0 0 ' + width + ' ' + height)
    // .attr('width', width + margin.left + margin.right)
    // .attr('height', height + margin.top + margin.bottom)
    // .append('g')
    // .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

const itemId = $('#price-chart').data('id');

// init and update
let xScale;
let yScale;
let xAxis;
let yAxis;
let init = false;
initGraph();
getJSON('/api/' + itemId);

let t = d3.transition()
    .duration(500);

setInterval(function() {
    getJSON('/api/' + itemId);
}, 3000);

// mouse handlers
function handleMouseOut(d, i) {
    // reset radius
    d3.select(this)
        .attr('r', 5);
    // remove text
    d3.select('#t' + d.time)
        .remove();
}

function handleMouseOver(d, i) {
    // increase radius
    d3.select(this)
        .attr('r', 10);
    // display price
    svg.append('text')
        .attr('id', 't' + d.time)
        .attr('x', () => xScale(d.time))
        .attr('y', () => yScale(d.price) - 15)
        .text(() => d.price);
}

function initGraph() {
    xScale = d3.scaleLinear()
        .range([0, width]);

    yScale = d3.scaleLinear()
        .range([height, 0]);

    xAxis = d3.axisBottom()
        .tickFormat(d => new Date(d)
        .toLocaleDateString('de-DE', dateFormatOptions))
        .ticks(5);
    yAxis = d3.axisLeft()
        .tickFormat(d => d)
        .ticks(10);

    vertLine(0, yScale, false);

    svg.append('path') // append path
        .datum(['dummy']) // bind data
        .attr('class', 'line'); // class for styling

    // x axis in roup tag
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')');

    // y axis in group tag
    svg.append('g')
        .attr('class', 'y axis');
    //     .call(yAxis);

    // svg.append('path') // append path
        // .datum(data) // bind data
        // .attr('class', 'line') // class for styling
        // .attr('d', line); // call line generator

    // Append a circle for each datapoint
    // svg.selectAll('.dot')
    //     .data(data)
    //     .enter().append('circle')
    //     .attr('class', 'dot') // class for styling
    //     .attr('cx', (d, i) =>  xScale(d.time) )
    //     .attr('cy', (d) => yScale(d.price) )
    //     .attr('r', 5)
    //     .on('mouseover', handleMouseOver)
    //     .on('mouseout', handleMouseOut);


    init = true;
}

function vertLine(y, yScale, update) {
    if (!update) {
        svg.append('line')
            .attr('id', 'minPriceLine')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', yScale(y))
            .attr('y2', yScale(y))
            .attr('class', 'minPrice');
        svg.append('text')
            .attr('id', 'minPriceText')
            .attr('y', yScale(y))
            .attr('x', width)
            .text(y);
    } else {
        let line = svg.select('#minPriceLine');
        let text = svg.select('#minPriceText');
        line
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', yScale(y))
            .attr('y2', yScale(y))
            .attr('class', 'minPrice');
        text
            .attr('y', yScale(y))
            .attr('x', width)
            .text(y);
    }
}


function drawGraph(data) {
    if (!init) {
        return;
    }

    console.log('update');

    const yMin = data.getMin('price')['price'];
    const yMax = data.getMax('price')['price'];
    const xMin = data.getMin('time')['time'];
    const xMax = data.getMax('time')['time'];

    xScale.domain([xMin, xMax]);
    yScale.domain([yMin - .5, (yMax - -.5)]); // + does not work, because js is great
    yAxis.scale(yScale);
    xAxis.scale(xScale);

    vertLine(yMin, yScale, true);

    // line generator
    let line = d3.line()
        .x(function(d) { return xScale(d.time); })
        .y(function(d) { return yScale(d.price); });
        // .curve(d3.curveMonotoneX) // smoothing

    let x = svg.selectAll('.x.axis');
    let newX = x.enter().append('g')
        // .attr('class', 'x axis');
    x.merge(newX).transition(t)
        .call(xAxis);

    let y = svg.select('.y.axis');
    let newY = y.enter().append('g')
        // .attr('class', 'y axis');
    y.merge(newY).transition(t)
        .call(yAxis);

    svg.select('path') // append path
        .datum(data) // bind data
        .attr('class', 'line') // class for styling
        .attr('d', line); // call line generator

    // Append a circle for each datapoint
    let dot = svg.selectAll('.dot')
        .data(data);
    dot.exit().remove();
    dot.enter().append('circle')
        .merge(dot)
        .attr('class', 'dot') // class for styling
        .attr('cx', d => xScale(d.time) )
        .attr('cy', d => yScale(d.price) )
        .attr('r', 5)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

}


function getJSON(url) {
    let xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
        let status = xhr.status;
        if (status == 200) {
            drawGraph(xhr.response);
        } else {
            console.log('Something went wrong: ' + xhr.statusText);
        }
    };
    xhr.send();
};

