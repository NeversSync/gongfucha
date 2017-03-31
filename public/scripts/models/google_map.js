'use strict';

const markers = [];
let open = '';
let gMap;

function initMap() {
  //initialize map and center it
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: {lat: 45.549863, lng: -122.675790},
    scrollwheel: false
  });

  const locations = TeaLocation.all;
  //loop through locations array and populate map with markers
  for (let i = 0; i < locations.length; i++) {
    let url = placesUrl(locations[i].shopname);

    //send GET request to Places Details API for shop info
    $.get(`/maps?query=${locations[i].shopname}`).done(function(response) {
      console.log('Place Details response: ', response);

      let marker = createMarker(response, map);
      let infoWindow = createInfoWindow(response, locations[i]);

      //check if shop is open
      isOpen(response.result);

      //click handler to open info windows
      marker.addListener('click', function() {
        infoWindow.open(map, marker);
      });
      //add reference to marker to corresponding shop
      locations[i].marker = marker;
      //markers array so we can clear existing markers from the map/repopulate them
      markers.push(marker);
    });
  }
  //re-center map upon window resize
  google.maps.event.addDomListener(window, 'resize', function() {
    const center = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(center);
  });
  gMap = map;
}

function createMarker(res, map) {
  return new google.maps.Marker({
    position: res.result.geometry.location,
    map: map,
  });
}

function createInfoWindow(res, shop) {
  return new google.maps.InfoWindow({
    content: `<p style="font-weight:bold;">${shop.shopname}</p>
              <p>${res.result.formatted_address}</p>
              ${open}
              <p>${res.result.formatted_phone_number}</p>
              <p><a href="${res.result.website}">${res.result.website}</a></p>`,
    maxWidth: 120
  });
}

function removeMarker(marker) {
  marker.setMap(null);
}

function removeMarkers() {
  markers.forEach(marker => {
    marker.setMap(null);
  });
}

function showMarkers() {
  markers.forEach(marker => {
    marker.setMap(gMap);
  });
}

//format the URL for the call to Places API
function placesUrl(shopname) {
  return `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${shopname}&key=${process.env.API_KEY}`
}
//format the URL for the call to Places Details API
function placeDetailsUrl(id) {
  return `https://maps.googleapis.com/maps/api/place/details/json?placeid=${id}&key=${process.env.API_KEY}`
}

function isOpen(shop) {
  if (shop.hasOwnProperty('opening_hours')) {
    //if hours are listed, set the info box as being OPEN NOW or CLOSED NOW
    if (shop.opening_hours.open_now) {
      open = '<p style="color:#0f0;">Open now</p>';
    } else {
      open = '<p style="color:#f00;">Closed now</p>';
    }
  }
}

function showResultMarkers() {
  removeMarkers();
  $('.shopsection:visible').each((index, shop) => {
    let teaLocationId = parseInt($(shop).attr('data-tea-location-id'));
    let teaLocation = TeaLocation.all.find(tl => {
      return tl.tealocation_id === teaLocationId;
    });
    teaLocation.marker.setMap(gMap);
  });
}