var geoLat = document.getElementById("id_user_lat");
var geoLng = document.getElementById("id_user_lng");
var geo = getLocation()

function getLocation() {
    M.toast({html: "Pulling Lat / Lng Info."})
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        // Error function
        M.toast({html: "Geolocation is not supported by this browser."})
    }
}

function showPosition(position) {
    geoLat.value =  position.coords.latitude
    geoLng.value =  position.coords.longitude;
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            M.toast({html: "User denied the request for Geolocation."})
             geoLat.value =  null
             geoLng.value =  null
            break;
        case error.POSITION_UNAVAILABLE:
            M.toast({html: "Location information is unavailable."})
            geoLat.value =  null
             geoLng.value =  null
            break;
        case error.TIMEOUT:
            M.toast({html: "The request to get user location timed out."})
            geoLat.value =  null
             geoLng.value =  null
            break;
        case error.UNKNOWN_ERROR:
            M.toast({html: "An unknown error occurred when accessing your location."})
            geoLat.value =  null
             geoLng.value =  null
            break;
    }
}