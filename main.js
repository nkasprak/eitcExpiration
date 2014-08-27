var calcInterface = {
	getInputs : function() {
		var theInputs = {};
		theInputs.wages = this.cleanInput($("#wage_input").val());
		theInputs.numChildren = this.cleanInput($("#children_input").val()*1);
		theInputs.filingStatus = this.cleanInput($("#fs_input").val()*1);
		return theInputs;
	},
	chartData: {},
	setInput : function(inputID, value) {
		$("#"+inputID).val(value);
	},
	cleanInput: function(uString) {
		uString = uString + "";
		uString = uString.replace(/[^\d.-]/g,'');
		
		//Round to nearest dollar
        uString = Math.round(uString*1);
		
		//It's still possible to get a nonsensical value (for example, if the user enters two decimal points)
		//If so, set to zero
        if (isNaN(uString)) uString = 0;
		return uString;
	},
	updateChart: function() {
		var i,j,thePoint,use;
		var theInputs = calcInterface.getInputs();
		var rawData = calculator.dataTableForChart(theInputs);
		
		var theData = [];
		
		for (i = 1;i<4;i++) {
			theData[i-1] = [];
			for (j=0;j<rawData.length;j++) {
				thePoint = [rawData[j][0],0-rawData[j][i]];
				theData[i-1].push(thePoint);
			}
		}
		
		var dataObj = [
			{ label: "Child Tax Credit", data: theData[2]},
			{ label: "EITC 3 Child", data: theData[1]},
			{ label: "EITC Marriage Penalty", data: theData[0]}
		];
		
		for (i=0;i<dataObj.length;i++) {
			dataObj[i].shadowSize = 0;
			//dataObj[i].hoverable = true;	
		}
		
		
		calcInterface.chartData = dataObj;
		
		if (typeof(calcInterface.thePlot==="undefined")) {
			var addCommas = function(nStr) {
				//http://stackoverflow.com/questions/6392102/add-commas-to-javascript-output
				nStr += '';
				var x = nStr.split('.');
				var x1 = x[0];
				var x2 = x.length > 1 ? '.' + x[1] : '';
				var rgx = /(\d+)(\d{3})/;
				while (rgx.test(x1)) {
					x1 = x1.replace(rgx, '$1' + ',' + '$2');
				}
				return x1 + x2;
			};
			var tickFormatFunction = function(val) {
				if (val<0) return "-$" + addCommas(Math.abs(val));
				else return "$" + addCommas(val);	
			};
			
			calcInterface.thePlot = $.plot(calcInterface.theChart,calcInterface.chartData, {
				series: {
					lines: {
						show:	true,
						fill: 0.8,
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
							color: "#000",
							lineWidth: 2,
							yaxis: { from: 0, to: 0}
						},
						{
							color: "#000",
							lineWidth: 2,
							xaxis: { from: 0, to: 0}
						}
					],
				},
				
				axisLabels: {
					show: true
				},
				
				xaxis: {
					min:0,
					max:57000	,
					tickLength:10,
					position:"top",
					color:"#444",
					ticks:5,
					tickColor:"#444",
					tickFormatter:tickFormatFunction,
					axisLabel: "Household Wage Income"
				},
				
				yaxis: {
					min:-3000,
					max:0,
					tickLength:10,
					color:"#444",
					tickColor:"#444"	,
					tickFormatter:tickFormatFunction,
					axisLabel: "Loss in Benefits"
				},
				
				legend: {
					position: "se"	,
					labelBoxBorderColor:"#fff",
					show:false
				},
				
				colors: [
					"#eb9123",	
					"#0c61a4",
					"#003768"
				],
				
			});
		}
		
		calcInterface.theChart.bind("plothover",function(event, pos, item) {
			if (calcInterface.mouseIsDown) {
			var wages = Math.round(pos.x);
			var data = calcInterface.chartData;
			//remove the last custom point
			if (calcInterface.userPoint) {
				for (var i = 0;i<data.length;i++) {
					data[i].data = data[i].data.filter(function(element) {
						return !(element[0] == calcInterface.userPoint);
					});
				}
			}
			calcInterface.userPoint = wages;
			var theInputs = calcInterface.getInputs();
			theInputs.wages = wages;
			var newYs = {
				eitc:	calculator.findEitcChangeAmounts(theInputs),
				ctc:	calculator.findActcChangeAmounts(theInputs)
			}
			data[0].data.push([wages,0-newYs.ctc]);
			data[1].data.push([wages,0-newYs.eitc.lossFromEndOfThirdChildTier]);
			data[2].data.push([wages,0-newYs.eitc.lossFromEndOfMPR]);
			
			for (var i = 0;i<data.length;i++) {
				data[i].data.sort(function(a,b) {return a[0]-b[0]})
			}
			
			
			
			calcInterface.thePlot.setData(data);
			
			calcInterface.thePlot.draw();
			
			
				calcInterface.updateWageAmount(wages);
			}
			
		});
		
		calcInterface.theChart.bind("plotclick",function(event, pos, item) {
			var wages = Math.round(pos.x);
			calcInterface.updateWageAmount(wages);
		});
	
	},
	updateWageAmount: function(wages) {
		calcInterface.setInput("wage_input",wages);
		calcInterface.thePlot.getOptions().grid.markings[2] = {
			color: "#b9292f",
			lineWidth: 2,
			xaxis: { from: wages, to: wages}
		};
		calcInterface.thePlot.setupGrid();
		calcInterface.thePlot.draw();
		calcInterface.changeInput();
	},
	mouseIsDown: false,
	changeInput: function() {
		var theInputs, results;
		
		theInputs = calcInterface.getInputs();
		
		eitcResults = calculator.findEitcChangeAmounts(theInputs);
		ctcResults = calculator.findActcChangeAmounts(theInputs);
		
		$("span#result_thirdChildTier").html("-$" + Math.round(eitcResults.lossFromEndOfThirdChildTier));
		$("span#result_marriagePenalty").html("-$" + Math.round(eitcResults.lossFromEndOfMPR));
		$("span#result_ctc").html("-$" + Math.round(ctcResults));
		$("span#result_total").html("-$" + Math.round(eitcResults.lossFromEndOfThirdChildTier + eitcResults.lossFromEndOfMPR + ctcResults));
	},
};


$(document).ready(function() {
	
	calcInterface.theChart = $("#flotChart");
	calcInterface.theChart.css("height",0.6*$("#flotChart").width());
	
	$(window).on("mousedown",function(e) {
		calcInterface.mouseIsDown = true;
	});
	$(window).on("mouseup",function(e) {
		calcInterface.mouseIsDown = false;
	});
	
	$("table#inputs #wage_input").change(function() {
		var cleanValue = calcInterface.cleanInput($(this).val());
		$(this).val(cleanValue);
		calcInterface.updateWageAmount(cleanValue);
	});
	
	$("table#inputs :input").change(function() {
		calcInterface.changeInput();

	});
	
	$("table#inputs select").change(function() {
		calcInterface.updateChart();
		
	});
	
	$("#children_input").trigger("change");
	calcInterface.updateWageAmount($("#wage_input").val());
	
	$(window).resize(function() {
		calcInterface.theChart.css("height",0.6*$("#flotChart").width());
		calcInterface.thePlot.setupGrid();
		calcInterface.thePlot.draw();
	});
	
});