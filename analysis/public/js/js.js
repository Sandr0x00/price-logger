/* global $, d3, window, XMLHttpRequest, setInterval, alert */

function getJSON(url) {
    let xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
        let status = xhr.status;
        if (status == 200) {
            blub(xhr.response);
        } else {
            alert('Something went wrong: ' + xhr.statusText);
        }
    };
    xhr.send();
};

const itemId = $('#price-chart').data('id');

let inter = setInterval(function() {
    getJSON('/api/' + itemId);
}, 15000);

getJSON('/api/' + itemId);

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


function handleMouseOut(d, i) {
    // reset radius
    d3.select(this)
        .attr('r', 5);
    // remove text
    d3.select('#t' + d.time)
        .remove();
}

const margin = {top: 50, right: 50, bottom: 50, left: 50};
const width = window.innerWidth - margin.left - margin.right - 50;
const height = window.innerHeight - margin.top - margin.bottom - 150;
const dateFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

const svg = d3.select('#price-chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

function blub(data) {
    const yMin = data.getMin('price')['price'];
    const yMax = data.getMax('price')['price'];
    const xMin = data.getMin('time')['time'];
    const xMax = data.getMax('time')['time'];

    let xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, width]);

    let yScale = d3.scaleLinear()
        .domain([yMin - .5, (yMax - -.5)]) // + does not work, because js is great
        .range([height, 0]);

    // line generator
    let line = d3.line()
        .x(function(d) { return xScale(d.time); })
        .y(function(d) { return yScale(d.price); });
        // .curve(d3.curveMonotoneX) // smoothing

    let xAxis = d3.axisBottom(xScale)
        .tickFormat((d,i) => new Date(d).toLocaleDateString('de-DE', dateFormatOptions))
        .ticks(5);
    let yAxis = d3.axisLeft(yScale)
        .tickFormat((d,i) => d)
        .ticks(10);

    // x axis in roup tag
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    // y axis in group tag
    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    svg.append('path') // append path
        .datum(data) // bind data
        .attr('class', 'line') // class for styling
        .attr('d', line); // call line generator

    // Append a circle for each datapoint
    svg.selectAll('.dot')
        .data(data)
        .enter().append('circle')
        .attr('class', 'dot') // class for styling
        .attr('cx', (d, i) =>  xScale(d.time) )
        .attr('cy', (d) => yScale(d.price) )
        .attr('r', 5)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

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
}
