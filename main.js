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
	addCommas: function(nStr) {
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
	},
	plotHoverFunction: function(event, pos, item) {
		if (calcInterface.mouseIsDown) {
			var wages, data, i, theInputs, newYs, xArr, maxWage;
			wages = Math.max(0,Math.round(pos.x));
			data = calcInterface.chartData;
			
			//remove the previous custom point
			if (calcInterface.userPoint) {
				for (i = 0;i<data.length;i++) {
					data[i].data = data[i].data.filter(function(element) {
						return !(element[0] == calcInterface.userPoint);
					});
				}
			}
			
		
			xArr = [];
			for (i=0;i<data[0].data.length;i++) {
				xArr.push(data[0].data[i][0]);
			}
			
			maxWage = Math.max.apply(Math,xArr);
			if (wages >= maxWage) {
				wages = maxWage;
				calcInterface.userPoint = null;
			} else {
				calcInterface.userPoint = wages;	
			}
			theInputs = calcInterface.getInputs();
			theInputs.wages = wages;
			newYs = {
				eitc:	calculator.findEitcChangeAmounts(theInputs),
				ctc:	calculator.findActcChangeAmounts(theInputs)
			}
			data[0].data.push([wages,0-newYs.ctc]);
			data[1].data.push([wages,0-newYs.eitc.lossFromEndOfThirdChildTier]);
			data[2].data.push([wages,0-newYs.eitc.lossFromEndOfMPR]);
			
			for (i = 0;i<data.length;i++) {
				data[i].data.sort(function(a,b) {return a[0]-b[0]})
			}
			
			calcInterface.thePlot.setData(data);
			calcInterface.thePlot.draw();
			calcInterface.updateWageAmount(wages);
		}	
	},
	plotClickFunction: function(event, pos, item) {
		var wages = Math.round(pos.x);
		calcInterface.updateWageAmount(wages);
	},
	updateChart: function() {
		var i,j,thePoint,use,theInputs,rawData,theData,dataObj;
		theInputs = calcInterface.getInputs();
		rawData = calculator.dataTableForChart(theInputs);
		
		theData = [];
		
		for (i = 1;i<4;i++) {
			theData[i-1] = [];
			for (j=0;j<rawData.length;j++) {
				thePoint = [rawData[j][0],0-rawData[j][i]];
				theData[i-1].push(thePoint);
			}
		}
		
		dataObj = [
			{ label: "Child Tax Credit", data: theData[2]},
			{ label: "EITC 3 Child", data: theData[1]},
			{ label: "EITC Marriage Penalty", data: theData[0]}
		];
		
		for (i=0;i<dataObj.length;i++) {
			dataObj[i].shadowSize = 0;
		}
		
		calcInterface.chartData = dataObj;
		
		if (typeof(calcInterface.thePlot==="undefined")) {
			calcInterface.thePlot = $.plot(calcInterface.theChart,calcInterface.chartData, calculator.parms.chartOptions);
		}
		
		calcInterface.updateWageAmount(theInputs.wages);
		
		
	
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
		var theInputs, eitcResults, ctcResults;
		
		theInputs = calcInterface.getInputs();
		
		eitcResults = calculator.findEitcChangeAmounts(theInputs);
		ctcResults = calculator.findActcChangeAmounts(theInputs);
		
		$("span#result_thirdChildTier").html("-$" + calcInterface.addCommas(Math.round(eitcResults.lossFromEndOfThirdChildTier)));
		$("span#result_marriagePenalty").html("-$" + calcInterface.addCommas(Math.round(eitcResults.lossFromEndOfMPR)));
		$("span#result_ctc").html("-$" + calcInterface.addCommas(Math.round(ctcResults)));
		$("span#result_total").html("-$" + calcInterface.addCommas(Math.round(eitcResults.lossFromEndOfThirdChildTier + eitcResults.lossFromEndOfMPR + ctcResults)));
	},
};


$(document).ready(function() {
	
	calcInterface.theChart = $("#flotChart");
	calcInterface.theChart.css("height",0.6*$("#flotChart").width());
	calcInterface.theChart.bind("plothover",calcInterface.plotHoverFunction);
	calcInterface.theChart.bind("plotclick",calcInterface.plotClickFunction);
	
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
	
	$("table#inputs select#children_input").change(function() {
		if ($(this).val() > 0) {
			if ($("table#inputs select#fs_input").val() == 0) {
				$("table#inputs select#fs_input").val(2);	
			}
			$("table#inputs select#fs_input").children("option").first().attr("disabled","disabled");
			$("table#inputs select#fs_input").children("option").eq(2).removeAttr("disabled");
		} else {
			if ($("table#inputs select#fs_input").val() == 2) {
				$("table#inputs select#fs_input").val(0);	
			}
			$("table#inputs select#fs_input").children("option").first().removeAttr("disabled");
			$("table#inputs select#fs_input").children("option").eq(2).attr("disabled","disabled");
		}
	});
	
	$("table#inputs select#fs_input").change(function() {
		if ($(this).val() == 2) {
			if ($("table#inputs select#children_input").val() == 0) {
				$("table#inputs select#children_input").val(1);	
			}
		}
	});
	
	$("#children_input").trigger("change");
	calcInterface.updateWageAmount($("#wage_input").val());
	$(window).trigger("resize");
	
	$(window).resize(function() {
		calcInterface.theChart.css("height",0.6*$("#flotChart").width());
		$("#flotChart .flot-tick-label").css("font-size",Math.min(calcInterface.theChart.height()/20,12) + "px");
		calcInterface.thePlot.setupGrid();
		calcInterface.thePlot.draw();
	});
	
});