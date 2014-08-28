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
		if (calcInterface.isAnimating()) return false;
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
		if (calcInterface.isAnimating() == true) return false;
		var wages = Math.round(pos.x);
		calcInterface.updateWageAmount(wages);
	},
	isAnimating: function() {
		if (this.animation) {
			if (this.animation.active==true) {
				return true;	
			}
		}
		return false;
	},
	updateChart: function() {
		var i,j,thePoint,use,theInputs,rawData,theData,dataObj,range;
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
		if (typeof(calcInterface.thePlot)=="undefined" || (calculator.parms.variableChartAxes == true && calculator.parms.animateAxes == false)) {
			range = calcInterface.getRange(calcInterface.chartData);
			calculator.parms.chartOptions.xaxis.max = range.newXmax;
			calculator.parms.chartOptions.yaxis.min = range.newYmin;
			calcInterface.thePlot = $.plot(calcInterface.theChart,calcInterface.chartData, calculator.parms.chartOptions);
			calcInterface.updateWageAmount(theInputs.wages);
		} else {
			if (calculator.parms.animateAxes == true) {
				calcInterface.animateChart(600,calcInterface.updateWageAmount,theInputs.wages);
			}
			else {
				calcInterface.thePlot.setData(calcInterface.chartData);
				calcInterface.thePlot.draw();
				calcInterface.updateWageAmount(theInputs.wages);
			}
		}
	},
	
	animateChart: function(length,callback, args) {
		var xChange, yChange, percentChange;
		var axes = calcInterface.thePlot.getAxes();
		if (typeof(calcInterface.animation)==="undefined") {
			calcInterface.animation = {};	
		}
		
		var range = calcInterface.getRange(calcInterface.chartData);
		
		if (calculator.parms.maintainAspectRatio == true) {
			xChange = 1+(range.newXmax - axes.xaxis.max)/axes.xaxis.max;
			yChange = 1+(range.newYmin - axes.yaxis.min)/axes.yaxis.min;
			percentChange = Math.max(xChange,yChange);
			newXmax = axes.xaxis.max*percentChange;
			newYmin = axes.yaxis.min*percentChange;
		} else {
			newXmax = range.newXmax;
			newYmin = range.newYmin;
		}
		
		calcInterface.animation = {
			active:true,
			animationFrame:0,
			oldYMin: axes.yaxis.min,
			oldXMax: axes.xaxis.max,
			newXMax: newXmax,
			newYMin: newYmin,
			length: length,
			numFrames: length/30,
			onCompleteFunction: callback,
			onCompleteArgs: args,
			easing: function(x) {
				function ease1(x) {
					return  (1-Math.cos(x*Math.PI))/2;
				}
				return ease1(ease1(x));
			}
		}
		$(calcInterface.theChart).css("cursor","default");
		calcInterface.thePlot.setData(calcInterface.chartData);
		axes.yaxis.min = calcInterface.animation.oldYMin;
		axes.xaxis.max = calcInterface.animation.oldXMax;
		calcInterface.thePlot.setupGrid();
		calcInterface.thePlot.draw();
		setTimeout(function() {
			calcInterface.animation.animationTimer = setInterval(calcInterface.chartFrame,30)
		},50);
	},
	
	chartFrame: function() {
		var a = calcInterface.animation;
		var percentDone = a.easing(a.animationFrame/a.numFrames);
		var yMin = a.oldYMin + percentDone*(a.newYMin - a.oldYMin);
		var xMax = a.oldXMax + percentDone*(a.newXMax - a.oldXMax);
		calculator.parms.chartOptions.xaxis.max = xMax;
		calculator.parms.chartOptions.yaxis.min = yMin;
		calcInterface.thePlot = $.plot(calcInterface.theChart,calcInterface.chartData, calculator.parms.chartOptions);
		
		a.animationFrame++;
		if (a.animationFrame > a.numFrames) {
			clearTimeout(a.animationTimer);
			a.active = false;
			$(calcInterface.theChart).css("cursor","pointer");
			a.onCompleteFunction(a.onCompleteArgs);	
		}
	},
	
	getRange: function(d) {
		var i, newXmax=0;newYmin=0;
		for (i=0;i<d[0].data.length;i++) {
			newXmax = Math.max(newXmax, d[0].data[i][0]);
			newYmin = Math.min(newYmin, d[0].data[i][1] + d[1].data[i][1] + d[2].data[i][1]);
		}
		return {newXmax: newXmax,newYmin: newYmin};	
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
	}
};


$(document).ready(function() {
	
	calcInterface.theChart = $("#flotChart");
	calcInterface.theChart.find().addBack().on("selectstart",function(e) {
		e.preventDefault();
	});
	calcInterface.theChart.css("height",0.6*$("#flotChart").width());
	calcInterface.theChart.bind("plothover",calcInterface.plotHoverFunction);
	calcInterface.theChart.bind("plotclick",calcInterface.plotClickFunction);
	
	$(document).on("mousedown",function(e) {
		calcInterface.mouseIsDown = true;
	});
	$(document).on("mouseup",function(e) {
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
	
	$("#animationMode").change(function() {
		var p = calculator.parms;
		p.animateAxes = false;
		p.variableChartAxes = true;
		p.maintainAspectRatio = false;
		$("#children_input").val(3);
		$("#fs_input").val(1);
		$("#children_input").trigger("change");
		var val = $(this).val();
		switch (val) {
			case "static":
				p.variableChartAxes = false;
				p.animateAxes = false;
			break;
			case "free":
				p.variableChartAxes = true;
				p.animateAxes = true;
				p.maintainAspectRatio = false;
			break;
			case "fixed":
				p.variableChartAxes = true;
				p.animateAxes = true;
				p.maintainAspectRatio = true;
			break;
		}
	});
	$("#animationMode").trigger("change");
	
});