// EITC calculator - 2018 expiration changes
// by Nick Kasprak and Bryann DaSilva
// CBPP

// Calculator parameters

var calculator = {};


(function(c) {
	
	//storage for parameters object
	var p = {};
	
	//storage for eitc parameters, indexed by number of children	
	/*Keys:
		eiba:	earned income base amount
		bp:		begin phaseout
		mpr:	marriage penalty relief
		pir:	phasein rate
		por:	phaseout rate
	*/
	
	p.eitc = {
		0:	{
			eiba:	6990,
			bp:		8750,
			mpr:	{
				expiration:	3670,
				arra:		5860
			},
			pir:	{
				expiration:	0.0765,
				arra:		0.0765
			},
			por:	0.0765
		},
		1: {
			eiba:	10490,
			bp:		19240,
			mpr:	{
				expiration:	3670,
				arra:		5860
			},
			pir:	{
				expiration:	0.34,
				arra:		0.34
			},
			por:	0.1598
		},
		2:	{
			eiba:	14730,
			bp:		19240,
			mpr:	{
				expiration:	3670,
				arra:		5860
			},
			pir:	{
				expiration:	0.4,
				arra:		0.4
			},
			por:	0.2106
		},
		3:	{
			eiba:	14730,
			bp:		19240,
			mpr:	{
				expiration:	3670,
				arra:		5860
			},
			pir:	{
				expiration:	0.4,
				arra:		0.45
			},
			por:	0.2106
		}
	};
	
	//storage for child tax credit parameters
	/*Keys:
		pt:		phaseout threshold
		ps:		phaseout step
		pi:		phaseout interval
		a:		per child amount
		r:		rate of refundability
		eif:	earned income floor
	*/
	p.ctc = {
		pt:	{
			single:	75000,
			hoh:	75000,
			mfj:	110000,
			mfs:	55000	
		},
		ps:		50,
		pi:		1000,
		a:		1000,
		r:		.15,
		eif:	{
			expiration:	14700,
			arra:		3000	
		}
	};
	
	p.sd =  {
		single:	6700,
		hoh:	9800,
		mfj:	13400,
		mfs:	6700	
	}
	
	p.ex = 4250;
	
	//list filing statuses in order according to values in selector here for later reference
	p.fsTranslator = ["single","mfj","hoh","mfs"]; 
	
	p.tickFormatFunction = function(val) {
		if (val<0) return "-$" + calcInterface.addCommas(Math.abs(val));
		else return "$" + calcInterface.addCommas(val);	
	};
	
	p.variableChartAxes = true;
	p.animateAxes = true;
	p.maintainAspectRatio = true;
	
	p.tickFormatFunctionK = function(val) {
		if (val<0) return "-$" + calcInterface.addCommas(Math.abs(val/1000)) + "K";
		else return "$" + calcInterface.addCommas(val/1000) + "K";	
	};
	
	p.events = {};
	
	if ("ontouchstart" in window) {
		p.events.down = "touchstart";
		p.events.up = "touchend";
		p.events.move = "touchmove";
	} else {
		p.events.down = "mousedown";
		p.events.up = "mouseup";
		p.events.move = "mousemove";	
	}
	
	p.bottomMargin = 1.05;
	
	p.chartOptions = {
		series: {
			lines: {
				show:	true,
				fill: 1,
				lineWidth: 0
			},
			stack: true
			
		},
		
		grid: {
			show: true,
			hoverable: true,
			autoHighlight: false,
			clickable: true,
			borderWidth:0,
			markings: [
				{
					color: "#999",
					lineWidth: 4,
					yaxis: { from: -1, to: -1}
				}
			]
		},
		
		axisLabels: {
			show: true
		},
		
		xaxis: {
			min:1,
			/*max:57000	,*/
			tickLength:10,
			position:"top",
			color:"#444",
			ticks:5,
			tickColor:"#444",
			tickFormatter:p.tickFormatFunctionK,
			axisLabel: "Household Wage Income"
		},
		
		yaxis: {
			/*min:-3000,*/
			max:-1,
			/*tickLength:10,*/
			color:"#fff",
			tickColor:"#ccc"	,
			tickFormatter:p.tickFormatFunction,
			axisLabel: "Loss in Credits"
		},
		
		legend: {
			position: "se"	,
			labelBoxBorderColor:"#fff",
			show:false
		}
		
		/*colors: [
			"#eb9123",	
			"#0c61a4",
			"#003768"
		]*/
		
	}
	
	c.parms = p;
	
})(calculator);

