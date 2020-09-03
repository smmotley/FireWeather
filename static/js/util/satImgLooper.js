var imgLooper = null

export default function satLooper () {
    const dateSlider_sat = document.getElementById("timelineScrubber_sat");
    const sat_animate = document.getElementById("animate_sat");

    var elem = document.createElement("img");
        elem.setAttribute("id", "sat_img0");
        elem.setAttribute("src", "data:image/png;base64," + goes_image);
        document.getElementById("satImage").appendChild(elem)
        sat_animate.addEventListener('click',() => {
            console.log(sat_animate.value)
            if (sat_animate.value === 'paused') {
                // Animation is being requested, so set the value to play
                sat_animate.value = 'play'
                // Change the play button to a pause button
                $('.pause_play_button.sat').text('pause_circle_outline')
                $.ajax({
                    type: 'GET',
                    url: 'getSatImgs',
                    data: {},
                    success: function (data) {
                        console.log(data['sat_imgs'])
                        animateSat(elem, data['sat_imgs'], true)
                    },
                    error: function (xhr, errmsg, err) {
                        M.toast({html: "Could Not Load Images", classes: 'red rounded', displayLength: 2000});
                        console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
                        document.getElementById("progress_container").style.display = 'none';
                        document.getElementById("add_point").style.visibility = "hidden"
                    }
                })
            }
            else{
                console.log(sat_animate.value)
                sat_animate.value = 'paused'
                $('.pause_play_button.sat').text('play_circle_outline')
                animateSat(elem, null, false)
            }
        })
    // **********ANIMATION SLIDER CONTROLS FOR MAP***************
    dateSlider_sat.oninput = function(e) {
        // When slider moves, stop all animations. Return value contains info on layer that stopped animating.
        //var tileLayer = tileSet.animateTiles(map,tile_id,null,false)   // Stop Tile Animation

        // PAST --> PRESENT.
        // We always want time to increase as slider moves to the right (or decreases as slider moves left).
        // REQUIREMENTS: This code works because this.max was set by TileLoader when the tiles were loaded. We can
        //               use this to take the this.value of the slider, subtract that from the max and invert the value
        //               so that any non-forecast values will allow the slider to display PAST --> PRESENT as the
        //               slider is pulled from left to right.
         var frame = (parseInt(this.value) - parseInt(this.max)) * -1



        // Set the opacity of the layer we want to view at 0.7
        console.log("Animation toggle opacity: " + visible_layer_opacity)
        map.setPaintProperty(tile_id + '-tiles' + frame, 'raster-opacity', visible_layer_opacity);

        // Update the slider with the correct time display
        var prettyTime = tileSet.range_slider_times(tile_id)
        sliderTime.innerText = prettyTime[frame]
    }
    //***********ANIMATION SLIDER END*******************
    function animateSat(elem, data, animation) {
        if (animation === true) {
            imgLooper = setInterval(function () {
                loop()
            }, 300)
        }
        if (animation === false) {
            console.log("STOP", imgLooper)
            clearInterval(imgLooper)
            return
        }

        var frameCount = data.length;
        var frame = frameCount - 1;

        function loop() {
            if (typeof data[frame] !== "undefined")
            {
                elem.setAttribute("src", "data:image/png;base64," + data[frame]);
                frame = (frame + 1) % frameCount;
            }
        }
    }

}