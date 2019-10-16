import $ from 'jquery';

$(document).ready(() => {
    $('#menu-toggle').click(function(e) {
        e.preventDefault();
        $('#wrapper').toggleClass('toggled');
      });
});
