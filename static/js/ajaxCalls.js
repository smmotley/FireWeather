/**
 * Summary.     Updates fusion charts. It is invoked in various instances, including dropdown changes from:
 *              id=station_dropdown, id=day_dropdown.
 * @param {String} dd           Value from the dropdown
 * @para {String}  chartID      The name given to the chart (not the div id)
*/

function update_graph(dd_value, dd_id){
    console.log(dd_value)
        $.ajax({
            method: "POST",
            data : {csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken')[0].value,
                    dd_id: dd_id,
                    dd_value: dd_value},
            success: function(data) {
                console.log(data.pieChart)
                var temperatureChart = FusionCharts('lineChart');
                var mapeChart = FusionCharts('pieChart');
                temperatureChart.setJSONData(data.lineChart)
                mapeChart.setJSONData(data.pieChart)
      }
    })
}