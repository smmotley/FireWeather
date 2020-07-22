export default function sortTable(f,n){
	var rows = $('#fire_table tbody  tr').get();

	rows.sort(function(a, b) {
		var A = getVal(a);
		var B = getVal(b);
		if(A < B) {
			return -1*f;
		}
		if(A > B) {
			return 1*f;
		}
		return 0;
	});

	function getVal(elm){
		var v = $(elm).children('td').eq(n).text().toUpperCase();
		if($.isNumeric(v)){
			v = parseInt(v,10);
		}
		return v;
	}

	$.each(rows, function(index, row) {
		$('#fire_table').children('tbody').append(row);
	});
}

var f_id = 1;
var f_acres = 1;
var f_dist = 1;
var f_source = 1;
var f_spread = 1;
var f_time = 1;
$("#table_fire_id").click(function(){
    f_id *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_id,n);
});
$("#table_acres").click(function(){
    f_acres *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_acres,n);
});
$("#table_dist").click(function(){
    f_dist *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_dist,n);
});
$("#table_source").click(function(){
    f_source *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_source,n);
});
$("#table_spread").click(function(){
    f_spread *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_spread,n);
});
$("#table_time").click(function(){
    f_time *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_time,n);
});


