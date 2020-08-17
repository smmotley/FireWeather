var tempColors = {
	"-60": { color: "rgb(145,0,63)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-55": { color: "rgb(206,18,86)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-50": { color: "rgb(231,41,138)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-45": { color: "rgb(223,101,176)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-40": { color: "rgb(255,115,223)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-35": { color: "rgb(255,190,232)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-30": { color: "rgb(255,255,255)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-25": { color: "rgb(218,218,235)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-20": { color: "rgb(188,189,220)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-15": { color: "rgb(158,154,200)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-10": { color: "rgb(117,107,177)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-5": { color: "rgb(84,39,143)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"0": { color: "rgb(13,0,125)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"5": { color: "rgb(13,61,156)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"10": { color: "rgb(0,102,194)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"15": { color: "rgb(41,158,255)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"20": { color: "rgb(74,199,255)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"25": { color: "rgb(115,215,255)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"30": { color: "rgb(173,255,255)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"35": { color: "rgb(48,207,194)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"40": { color: "rgb(0,153,150)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"45": { color: "rgb(18,87,87)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"50": { color: "rgb(6,109,44)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"55": { color: "rgb(49,163,84)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"60": { color: "rgb(116,196,118)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"65": { color: "rgb(161,217,155)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"70": { color: "rgb(211,255,190)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"75": { color: "rgb(255,255,179)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"80": { color: "rgb(255,237,160)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"85": { color: "rgb(254,209,118)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"90": { color: "rgb(254,174,42)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"95": { color: "rgb(253,141,60)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"100": { color: "rgb(252,78,42)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"105": { color: "rgb(227,26,28)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"110": { color: "rgb(177,0,38)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"115": { color: "rgb(128,0,38)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"120": { color: "rgb(89,0,66)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"125": { color: "rgb(40,0,40)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" }
}

var tempDiffColors = {
	"-21": { color: "rgb(8,0,148)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-18": { color: "rgb(8,38,148)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-15": { color: "rgb(8,81,156)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-12": { color: "rgb(49,130,189)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-9": { color: "rgb(107,174,214)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-6": { color: "rgb(189,215,231)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-3": { color: "rgb(189,215,255)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"0": { color: "rgb(0,0,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"3": { color: "rgb(255,255,150)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"6": { color: "rgb(255,196,0)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"9": { color: "rgb(255,135,0)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"12": { color: "rgb(219,20,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"15": { color: "rgb(158,0,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"18": { color: "rgb(105,0,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"21": { color: "rgb(54,0,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" }
}

var precipColors = {
	"0.00": { color: "rgb(255, 255, 255)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"0.01": { color: "rgb(199,233,192)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"0.10": { color: "rgb(161,217,155)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"0.25": { color: "rgb(116,196,118)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"0.50": { color: "rgb(49,163,83)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"1.00": { color: "rgb(0,109,44)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"1.50": { color: "rgb(255,250,138)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"2.00": { color: "rgb(255,204,79)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"3.00": { color: "rgb(254,141,60)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"4.00": { color: "rgb(252,78,42)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"6.00": { color: "rgb(214,26,28)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"8.00": { color: "rgb(173,0,38)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"10.00": { color: "rgb(112,0,38)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"15.00": { color: "rgb(59,0,48)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"20.00": { color: "rgb(76,0,115)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"30.00": { color: "rgb(255,219,255)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" }
}

var windColors = {
	"0": { color: "rgb(16, 63, 120)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"5": { color: "rgb(34, 94, 168)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"10": { color: "rgb(29, 145, 192)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px black" },
	"15": { color: "rgb(65, 182, 196)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"20": { color: "rgb(127, 205, 187)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"25": { color: "rgb(180, 215, 158)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"30": { color: "rgb(223, 255, 158)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"35": { color: "rgb(255, 255, 166)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"40": { color: "rgb(255, 232, 115)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"45": { color: "rgb(255, 196, 0)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"50": { color: "rgb(255, 170, 0)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"60": { color: "rgb(255, 89, 0)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"70": { color: "rgb(255, 0, 0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"80": { color: "rgb(168, 0, 0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"100": { color: "rgb(110, 0, 0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"120": { color: "rgb(255, 190, 232)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"140": { color: "rgb(255, 115, 223)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" }
}

var rhColors = {
	"5": { color: "rgb(145,0,34)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"10": { color: "rgb(166,17,34)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"15": { color: "rgb(189,46,36)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"20": { color: "rgb(212,78,51)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"25": { color: "rgb(227,109,66)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"30": { color: "rgb(250,143,67)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"35": { color: "rgb(252,173,88)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"40": { color: "rgb(254,216,132)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"50": { color: "rgb(255,242,170)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"60": { color: "rgb(230,244,157)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"70": { color: "rgb(188,227,120)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"80": { color: "rgb(113,181,92)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"90": { color: "rgb(38,145,75)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"100": { color: "rgb(0,87,46)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" }
}

var rhDiffColors = {
	"-35": { color: "rgb(54,0,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-30": { color: "rgb(105,0,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-25": { color: "rgb(158,0,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-20": { color: "rgb(219,20,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"-15": { color: "rgb(255,135,0)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-10": { color: "rgb(255,196,0)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"-5": { color: "rgb(255,255,150)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"0": { color: "rgb(0,0,0)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"5": { color: "rgb(199,255,192)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"10": { color: "rgb(199,233,192)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"15": { color: "rgb(161,217,155)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"20": { color: "rgb(116,196,118)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"25": { color: "rgb(49,163,83)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"30": { color: "rgb(0,109,44)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"35": { color: "rgb(0,50,44)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" }
}

var visColors = {
	"1": { color: "rgb(166,17,34)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"3": { color: "rgb(212,78,51)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"5": { color: "rgb(227,109,66)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" },
	"7": { color: "rgb(254,216,132)", shadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black" },
	"10": { color: "rgb(0,102,194)", shadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white" }
}

function calculateTempColor(tval,deg) {
	var col, val;
	if(deg == "C") { val = (tval * (9/5)) + 32; } else { val = tval; }

	if(val < -60)                    { col = tempColors["-60"]; }
	else if(val >= -60 && val < -55) { col = tempColors["-55"];	}
	else if(val >= -55 && val < -50) { col = tempColors["-50"];	}
	else if(val >= -50 && val < -45) { col = tempColors["-45"];	}
	else if(val >= -45 && val < -40) { col = tempColors["-40"];	}
	else if(val >= -40 && val < -35) { col = tempColors["-35"];	}
	else if(val >= -35 && val < -30) { col = tempColors["-30"];	}
	else if(val >= -30 && val < -25) { col = tempColors["-25"];	}
	else if(val >= -25 && val < -20) { col = tempColors["-20"];	}
	else if(val >= -20 && val < -15) { col = tempColors["-15"]; }
	else if(val >= -15 && val < -10) { col = tempColors["-10"];	}
	else if(val >= -10 && val < -5)  { col = tempColors["-5"]; }
	else if(val >= -5 && val < 0)    { col = tempColors["0"];	}
	else if(val >= 0 && val < 5)     { col = tempColors["5"];   }
	else if(val >= 5 && val < 10)    { col = tempColors["10"];	}
	else if(val >= 10 && val < 15)   { col = tempColors["15"];	}
	else if(val >= 15 && val < 20)   { col = tempColors["20"];	}
	else if(val >= 20 && val < 25)   { col = tempColors["25"];	}
	else if(val >= 25 && val < 30)   { col = tempColors["30"];	}
	else if(val >= 30 && val < 35)   { col = tempColors["35"];	}
	else if(val >= 35 && val < 40)   { col = tempColors["40"];	}
	else if(val >= 40 && val < 45)   { col = tempColors["45"];  }
	else if(val >= 45 && val < 50)   { col = tempColors["50"];	}
	else if(val >= 50 && val < 55)   { col = tempColors["55"];	}
	else if(val >= 55 && val < 60)   { col = tempColors["60"];	}
	else if(val >= 60 && val < 65)   { col = tempColors["65"];	}
	else if(val >= 65 && val < 70)   { col = tempColors["70"];	}
	else if(val >= 70 && val < 75)   { col = tempColors["75"];	}
	else if(val >= 75 && val < 80)   { col = tempColors["80"];	}
	else if(val >= 80 && val < 85)   { col = tempColors["85"];	}
	else if(val >= 85 && val < 90)   { col = tempColors["90"];  }
	else if(val >= 90 && val < 95)   { col = tempColors["95"];	}
	else if(val >= 95 && val < 100)  { col = tempColors["100"];  }
	else if(val >= 100 && val < 105) { col = tempColors["105"]; }
	else if(val >= 105 && val < 110) { col = tempColors["110"];	}
	else if(val >= 110 && val < 115) { col = tempColors["115"];	}
	else if(val >= 115 && val < 120) { col = tempColors["120"];	}
	else if(val >= 120)              { col = tempColors["125"]; }

	return col;
}

function calculateTempDiffColor(val) {
	var col;
	if(val < -18)                    { col = tempDiffColors["-21"]; }
	else if(val >= -18 && val < -15) { col = tempDiffColors["-18"];	}
	else if(val >= -15 && val < -12) { col = tempDiffColors["-15"];	}
	else if(val >= -12 && val < -9) { col = tempDiffColors["-12"];	}
	else if(val >= -9 && val < -6) { col = tempDiffColors["-9"];	}
	else if(val >= -6 && val < -3) { col = tempDiffColors["-6"];	}
	else if(val >= -3 && val < 0) { col = tempDiffColors["-3"];	}
	else if(val == 0) { col = tempDiffColors["0"];	}
	else if(val > 0  && val <= 3) { col = tempDiffColors["3"];	}
	else if(val > 3 && val <= 6) { col = tempDiffColors["6"]; }
	else if(val > 6 && val <= 9) { col = tempDiffColors["9"];	}
	else if(val > 9 && val <= 12)    { col = tempDiffColors["12"];	}
	else if(val > 12 && val <= 15)     { col = tempDiffColors["15"];   }
	else if(val > 15 && val <= 18)    { col = tempDiffColors["18"];	}
	else if(val > 18)   { col = tempDiffColors["21"];	}

	return col;
}

function calculateRHDiffColor(val) {
	var col;
	if(val < -35)                    { col = rhDiffColors["-35"]; }
	else if(val >= -30 && val < -25) { col = rhDiffColors["-30"];	}
	else if(val >= -25 && val < -20) { col = rhDiffColors["-25"];	}
	else if(val >= -20 && val < -15) { col = rhDiffColors["-20"];	}
	else if(val >= -15 && val < -10) { col = rhDiffColors["-15"];	}
	else if(val >= -10 && val < -5) { col = rhDiffColors["-10"];	}
	else if(val >= -5 && val < 0) { col = rhDiffColors["-5"];	}
	else if(val == 0) { col = rhDiffColors["0"];	}
	else if(val > 0  && val <= 5) { col = rhDiffColors["5"];	}
	else if(val > 5 && val <= 10) { col = rhDiffColors["10"]; }
	else if(val > 10 && val <= 15) { col = rhDiffColors["15"];	}
	else if(val > 15 && val <= 20)    { col = rhDiffColors["20"];	}
	else if(val > 20 && val <= 25)     { col = rhDiffColors["25"];   }
	else if(val > 25 && val <= 30)    { col = rhDiffColors["30"];	}
	else if(val > 35)   { col = rhDiffColors["35"];	}

	return col;
}

function calculatePrecipColor(val) {
	var col;
	if(val >= 0.01 && val < 0.10) 		{ col = precipColors["0.01"]; }
	else if(val >= 0.10 && val < 0.25) 	{ col = precipColors["0.10"];}
	else if(val >= 0.25 && val < 0.50) 	{ col = precipColors["0.25"]; }
	else if(val >= 0.50 && val < 1.00) 	{ col = precipColors["0.50"];
	} else if(val >= 1 && val < 1.50) 	{ col = precipColors["1.00"]; }
	else if(val >= 1.50 && val < 2) 	{ col = precipColors["1.50"]; }
	else if(val >= 2 && val < 3) 		{ col = precipColors["2.00"]; }
	else if(val >= 3 && val < 4) 		{ col = precipColors["3.00"]; }
	else if(val >= 4 && val < 6) 		{ col = precipColors["4.00"]; }
	else if(val >= 6 && val < 8) 		{ col = precipColors["6.00"]; }
	else if(val >= 8 && val < 10) 		{ col = precipColors["8.00"]; }
	else if(val >= 10 && val < 15)		{ col = precipColors["100"]; }
	else if(val >= 15 && val < 20) 		{ col = precipColors["15.00"]; }
	else if(val >= 20 && val < 30) 		{ col = precipColors["20.00"]; }
	else if(val >= 30) 					{ col = precipColors["30.00"]; }
	else 								{ col = precipColors["0.00"]; }
	return col;
}

function calculateWindColor(wval,typ) {
	var col, val;
	if(typ == "kts") { val = (wval * 1.15078); } else { val = wval; }
	if(val > 0 && val < 5) 			{ col = windColors["0"];  }
	else if(val >= 5 && val < 10) 	{ col = windColors["5"]; }
	else if(val >= 10 && val < 15) 	{ col = windColors["10"]; }
	else if(val >= 15 && val < 20)  { col = windColors["15"]; }
	else if(val >= 20 && val < 25)  { col = windColors["20"]; }
	else if(val >= 25 && val < 30) 	{ col = windColors["25"]; }
	else if(val >= 30 && val < 35) 	{ col = windColors["30"]; }
	else if(val >= 35 && val < 40) 	{ col = windColors["35"]; }
	else if(val >= 40 && val < 45) 	{ col = windColors["40"]; }
	else if(val >= 45 && val < 50) 	{ col = windColors["45"]; }
	else if(val >= 50 && val < 60) 	{ col = windColors["50"]; }
	else if(val >= 60 && val < 70) 	{ col = windColors["60"]; }
	else if(val >= 70 && val < 80) 	{ col = windColors["70"]; }
	else if(val >= 80 && val < 100) 	{ col = windColors["80"]; }
	else if(val >= 100 && val < 120){ col = windColors["100"]; }
	else if(val >= 120 && val < 140){ col = windColors["120"]; }
	else 							{ col = windColors["140"];  }
	return col;
}

function calculateRhColor(val) {
	var col;
	if(val < 5) { col = rhColors["5"]; }
	else if(val >= 5 && val < 10) { col = rhColors["10"]; }
	else if(val >= 10 && val < 15) { col = rhColors["15"]; }
	else if(val >= 15 && val < 20) { col = rhColors["20"]; }
	else if(val >= 20 && val < 25) { col = rhColors["25"]; }
	else if(val >= 25 && val < 30) { col = rhColors["30"]; }
	else if(val >= 30 && val < 35) { col = rhColors["35"]; }
	else if(val >= 35 && val < 40) { col = rhColors["40"]; }
	else if(val >= 40 && val < 50) { col = rhColors["50"]; }
	else if(val >= 50 && val < 60) { col = rhColors["60"]; }
	else if(val >= 60 && val < 70) { col = rhColors["70"]; }
	else if(val >= 70 && val < 80) { col = rhColors["80"]; }
	else if(val >= 80 && val < 90) { col = rhColors["90"]; }
	else if(val > 90 && val <= 100){ col = rhColors["100"]; }
	return col;
}

function calculateVisColor(val) {
	var col;
	if(val < 3) { col = visColors["1"]; }
	else if(val >= 3 && val < 5) { col = visColors["3"]; }
	else if(val >= 5 && val < 7) { col = visColors["5"]; }
	else if(val >= 7 && val < 10) { col = visColors["7"]; }
	else if(val >= 10) { col = visColors["10"]; }
	return col;
}