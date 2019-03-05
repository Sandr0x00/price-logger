/* global $, d3, window, XMLHttpRequest, setInterval, console, document, base_url, itemId */

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
const svg = d3.select('#price-chart').append('svg')
    .attr('preserveAspectRatio', 'xMinYMin meet')
    // .style('margin', marginRatio.top + ' ' + marginRatio.right + ' ' + marginRatio.bottom + ' ' + marginRatio.left)
    .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
    .append('g')
    .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

function change() {
    document.title = itemId;
    window.history.pushState({'pageTitle':itemId}, '', '/' + itemId);

    $('.productLink').attr('href', base_url + itemId);
    $('.productImg').attr('src', '/img/' + itemId);
    getJSON(itemId, updateGraph);
}

// init and update
let xScale;
let yScale;
let xAxis;
let yAxis;
let init = false;

let transitionDuration = 0;

setInterval(function() {
    // only update json
    getJSON(itemId, updateGraph);
}, 30000);

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
        .transition()
        .duration(transitionDuration)
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(yMin))
        .attr('y2', yScale(yMin))
        .attr('class', 'minPrice');
    svg.select('#minPriceText')
        .transition()
        .duration(transitionDuration)
        .attr('y', yScale(yMin) + 4)
        .attr('x', width + 10)
        .text(yMin);

    // line generator
    let line = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.price));

    let x = svg.selectAll('.x.axis');
    let newX = x.enter().append('g');
    x.merge(newX).transition()
        .duration(transitionDuration)
        .call(xAxis);

    let y = svg.select('.y.axis');
    let newY = y.enter().append('g');
    y.merge(newY).transition()
        .duration(transitionDuration)
        .call(yAxis);

    let lineGraph = svg.select('.line')
        .datum(data);
    lineGraph.exit().remove();
    lineGraph.enter().append('path')
        .merge(lineGraph)
        .transition()
        .duration(transitionDuration)
        .attr('d', line);

    // Append a circle for each datapoint
    let dot = svg.selectAll('.dot')
        .data(data);
    dot.exit().remove();
    dot.enter().append('circle')
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut)
        .merge(dot)
        .transition()
        .duration(transitionDuration)
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.time) )
        .attr('cy', d => yScale(d.price) )
        .attr('r', 5);
}

function getJSON(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('get', '/api/' + url, true);
    xhr.responseType = 'json';
    xhr.onload = () => {
        let status = xhr.status;
        if (status == 200) {
            callback(xhr.response);
            transitionDuration = 500;
        } else {
            console.log('Something went wrong: ' + xhr.statusText);
        }
    };
    xhr.send();
};

$(document).ready(() => {
    $('.items').on('click', function() {
        itemId = $(this).data('id');
        change();
    });

    initGraph();
    change();
});
