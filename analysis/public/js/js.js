/* global $, d3, window, XMLHttpRequest, setInterval, console, document */

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
};
const DURATION_TIME = 500;

const svg = d3.select('#price-chart').append('svg')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    // .style('margin', marginRatio.top + ' ' + marginRatio.right + ' ' + marginRatio.bottom + ' ' + marginRatio.left)
    .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom)
    )
    .append('g')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

let itemId = $('#price-chart').data('id');

$(document).ready(() => {
    $('.items').on('click', function() {
        itemId = $(this).data('id');
        getJSON(itemId);
    });
});

// init and update
let xScale;
let yScale;
let xAxis;
let yAxis;
let init = false;
initGraph();
getJSON(itemId);

let t = d3.transition()
    .duration(500);

setInterval(function() {
    getJSON(itemId);
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
    // min price
    svg.append('line')
        .attr('id', 'minPriceLine')
        .attr('class', 'minPrice');
    svg.append('text')
        .attr('id', 'minPriceText');

    // line graph
    svg.append('path')
        .datum(['dummy']) // dummy data
        .attr('class', 'line');

    // x axis
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')');
    xScale = d3.scaleLinear()
        .range([0, width]);
    xAxis = d3.axisBottom()
        .tickFormat(d => new Date(d)
        .toLocaleDateString('de-DE', dateFormatOptions))
        .ticks(5);

    // y axis
    svg.append('g')
        .attr('class', 'y axis');
    yScale = d3.scaleLinear()
        .range([height, 0]);
    yAxis = d3.axisLeft()
        .tickFormat(d => d)
        .ticks(10);

    init = true;
}

function updateGraph(data) {
    if (!init) {
        return;
    }

    const yMin = data.getMin('price')['price'];
    const yMax = data.getMax('price')['price'];
    const xMin = data.getMin('time')['time'];
    const xMax = data.getMax('time')['time'];
    const diff = (yMax - yMin) * 0.1;

    xScale.domain([xMin, xMax]);
    yScale.domain([yMin - diff, (yMax - -diff)]); // + does not work, because js is great
    yAxis.scale(yScale);
    xAxis.scale(xScale);

    svg.select('#minPriceLine')
        .transition(t)
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(yMin))
        .attr('y2', yScale(yMin))
        .attr('class', 'minPrice');
    svg.select('#minPriceText')
        .transition(t)
        .attr('y', yScale(yMin))
        .attr('x', width)
        .text(yMin);

    // line generator
    let line = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.price));

    let x = svg.selectAll('.x.axis');
    let newX = x.enter().append('g');
    x.merge(newX).transition(t)
        .call(xAxis);

    let y = svg.select('.y.axis');
    let newY = y.enter().append('g');
    y.merge(newY).transition(t)
        .call(yAxis);

    svg.select('path')
        .datum(data)
        .attr('class', 'line')
        .transition(t)
        .attr('d', line);

    // Append a circle for each datapoint
    let dot = svg.selectAll('.dot')
        .data(data);
    dot.exit().remove();
    dot.enter().append('circle')
        .merge(dot)
        .transition(t)
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.time) )
        .attr('cy', d => yScale(d.price) )
        .attr('r', 5);
    dot.on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);
}


function getJSON(url) {
    let xhr = new XMLHttpRequest();
    xhr.open('get', '/api/' + url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
        let status = xhr.status;
        if (status == 200) {
            updateGraph(xhr.response);
        } else {
            console.log('Something went wrong: ' + xhr.statusText);
        }
    };
    xhr.send();
};

