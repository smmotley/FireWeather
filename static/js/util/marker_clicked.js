function getCookie(name){
    var cookieValue=null;
    if(document.cookie&&document.cookie!=''){
        var cookies=document.cookie.split(';');
        for(var i=0;i<cookies.length;i++){
            var cookie=cookies[i].trim();
            //Does this cookie string begin with the name we want?
            if(cookie.substring(0,name.length+1)==(name+'=')){
                cookieValue=decodeURIComponent(cookie.substring(name.length+1));
                break;
            }
        }
    }
    return cookieValue;
}

export function marker_clicked(eventObj) {
    /*
    var gmap = d3.select('.main-panel').append('div').attr('class','content')
        .append('div').attr('class','row');

    var card1 = gmap.append('div').attr('class',"col-md-4")
        .append('div').attr('class',"card")
        .attr('id', 'card1')
        .append('div').attr('class',"header")
        .append('h4').attr('class','title').text('Chart');

    d3.select('#card1')
        .append('div').attr('class', 'content')
        .append('div').attr('id','chartPreferences').attr('class','ct-chart ct-perfect-fourth')


    $("#map").animate({
            height: '400px'
        }, 1000);

    var test = $('#chart-1').closest('.card').css({
            visibility: 'visible',
            opacity: 1
        });
*/

    $.ajax({
        type: "POST",
        url: '',
        data: {
            csrfmiddlewaretoken: getCookie('csrftoken'),
            meter_id: eventObj /*Passingthedata*/
        },
        success: function (json) {
            /*Youdon'thavetodoanythingheresincethedefchartfunctionisalreadyrerenderingthechart
            inthelinereturnrender(....).YoucoulddoanIFNOTPOSTREQUESTTHENRETURNJSONinsteadof
            returningtheentirerender.
            */
            //console.log("it worked, here is what is being passed back from Python: " + json);
            FusionCharts.items["myChart"].setJSONData(json);
        },
        error: function () {
            console.log(eventObj)
        }
    });
}

export function change_graph_type(eventObj){

     $.ajax({
        type: "POST",
        url: '',
        data: {
            csrfmiddlewaretoken: getCookie('csrftoken'),
            graph_type: eventObj.target.id, /*Passingthedata*/
            ischecked: eventObj.target.checked
        },
        success: function (json) {
            /*Youdon'thavetodoanythingheresincethedefchartfunctionisalreadyrerenderingthechart
            inthelinereturnrender(....).YoucoulddoanIFNOTPOSTREQUESTTHENRETURNJSONinsteadof
            returningtheentirerender.
            */
            //console.log("it worked, here is what is being passed back from Python: " + json);
            FusionCharts.items["myChart"].setJSONData(json);
        },
        error: function () {
            console.log(eventObj)
        }
    });
}