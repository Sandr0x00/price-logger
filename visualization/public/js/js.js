/* global $, window, XMLHttpRequest, setInterval, console, document, base_url, itemId, title, loadImagesSync, updateGraph, initGraph */

let title;
let items = [];

function change() {
    getJSON(itemId, updateGraph);

    $('.productLink').attr('href', base_url + itemId);
    let img = $('.productImg');
    img.addClass('placeholder blur');
    img.attr('data-large', `/img/${itemId}`);
    img.css('background-image', 'url("/placeholder/' + itemId + '")');
    loadImagesSync(`/img/${itemId}`);

    $('.items').removeClass('current');
    $(`#${itemId}`).addClass('current');
}


setInterval(() => {
    // only update json
    getJSON(itemId, updateGraph);
    loadItems();
}, 30000);

setInterval(() => {
    loadStatus();
}, 10000);


function getJSON(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('get', '/prices/' + url, true);
    xhr.responseType = 'json';
    xhr.onload = () => {
        let status = xhr.status;
        if (status == 200) {
            let data = xhr.response;
            callback(data);
            if (data.title) {
                title = data.title;
            } else {
                title = data.id;
            }
            document.title = `Price-Logger | ${title}`;
            window.history.pushState({'pageTitle':title}, '', '/' + itemId);
        } else {
            console.log('Something went wrong: ' + xhr.statusText);
        }
    };
    xhr.send();
};

function loadItems() {
    let xhr = new XMLHttpRequest();
    xhr.open('get', '/items', true);
    xhr.responseType = 'json';
    xhr.onload = () => {
        let status = xhr.status;
        if (status == 200) {
            if (xhr.response.length === items.length && xhr.response.sort().every((value, index) => value === items.sort()[index])) {
                return;
            }
            $('#sidebar').empty();
            items = xhr.response;
            // create items
            items.sort().forEach(element => {
                $('#sidebar').prepend(`<a class="list-group-item items" href="#" data-id="${element}" id="${element}">${element}</a>`);
            });
            // add click action
            $('.items').on('click', function() {
                itemId = $(this).data('id');
                change();
            });
            // update item name
            $('.items').each(function() {
                let xhr = new XMLHttpRequest();
                xhr.open('get', '/infos/' + $(this).data('id'), true);
                xhr.onload = () => {
                    let status = xhr.status;
                    if (status == 200) {
                        $(this).text(xhr.response);
                    } else {
                        // do not update text
                    }
                };
                xhr.send();
            });
        }
    };
    xhr.send();
}

function loadStatus() {
    let xhr = new XMLHttpRequest();
    xhr.open('get', '/status', true);
    xhr.onload = () => {
        let status = xhr.status;
        if (status == 200) {
            let visu = xhr.response['visu-state'];
            let visuTime = xhr.response['visu-time'];
            let logger = xhr.response['logger-state'];
            let loggerTime = xhr.response['logger-time'];
            if (visu === 'active') {
                $('#statusVisu').addClass('active');
                $('#visuTime').text(visuTime);
            } else {
                $('#statusVisu').removeClass('active');
                $('#visuTime').text('');
            }
            if (logger === 'active') {
                $('#statusLogger').addClass('active');
                $('#loggerTime').text(visuTime);
            } else {
                $('#statusLogger').removeClass('active');
                $('#loggerTime').text('');
            }
        }
    };
    xhr.send();
}

$(document).ready(() => {
    loadItems();

    initGraph();
    change();

    $('#menu-toggle').click(function(e) {
        e.preventDefault();
        $('#wrapper').toggleClass('toggled');
      });
});
