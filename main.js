var calcInterface = {
	getInputs : function() {
		var theInputs = {};
		theInputs.wages = $("#wage_input").val()*1;
		theInputs.numChildren = $("#children_input").val()*1;
		theInputs.filingStatus = $("#fs_input").val()*1;
		return theInputs;
	},
	chartData: {}
};


$(document).ready(function() {

	$("#flotChart").css("height",0.8*$("#flotChart").width());
	
	$("table#inputs :input").change(function() {
		var theInputs, results;
		
		theInputs = calcInterface.getInputs();
		
		eitcResults = calculator.findEitcChangeAmounts(theInputs);
		ctcResults = calculator.findActcChangeAmounts(theInputs);
		
		$("span#result_thirdChildTier").html("$" + eitcResults.lossFromEndOfThirdChildTier);
		$("span#result_marriagePenalty").html("$" + eitcResults.lossFromEndOfMPR);
		$("span#result_ctc").html("$" + ctcResults);

	});
	
	$("table#inputs select").change(function() {
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
		
		var theChart = $("#flotChart").plot(calcInterface.chartData, {
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
				hoverable: true
			},
			xaxis: {
				min:0	
			},
			yaxis: {
				max:100	
			}
		});
		
		theChart.bind("plothover",function(event, pos, item) {
			var wages = Math.round(pos.x);
			var data = calcInterface.chartData;
			var theInputs = calcInterface.getInputs();
			theInputs.wages = wages;
			var newYs = {
				eitc:	calculator.findEitcChangeAmounts(theInputs),
				ctc:	calculator.findActcChangeAmounts(theInputs)
			}
			data[2].data.push([wages,newYs.ctc]);
			data[1].data.push([wages,newYs.eitc.lossFromEndOfThirdChildTier]);
			data[0].data.push([wages,newYs.eitc.lossFromEndOfMPR]);
			
			for (var i = 0;i<data.length;i++) {
				data[i].data.sort(function(a,b) {return a[0]-b[0]})
			}
			console.log(theChart);
			theChart.plot.setData(data);
			
			theChart.plot.draw();
			
		});
		
	});
	
});