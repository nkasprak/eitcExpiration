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
		var xChange, yChange, percentChange, newXmax, newYmin;
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
		$("#labelOverlay, #lineOverlay, #lossOverlay").hide();
		setTimeout(function() {
			calcInterface.animation.animationTimer = setInterval(calcInterface.chartFrame,30)
		},50);
	},
	
	wrapperMouseMoveFunction: function(e) {
		if (e.type=="touchmove") e = e.originalEvent.touches[0];
		var offset = $("#flotChart").offset();
		var axes = calcInterface.thePlot.getAxes();
		var pointOffset = calcInterface.thePlot.pointOffset({x:0,y:0});
		var x = axes.xaxis.c2p(e.pageX - offset.left - pointOffset.left);
		var y = axes.yaxis.c2p(e.pageY - offset.top - pointOffset.top);
		calcInterface.plotHoverFunction(null,{x:x,y:y});
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
			$(calcInterface.theChart).css("cursor","col-resize");
			$("#labelOverlay, #lineOverlay, #lossOverlay").show();
			a.onCompleteFunction(a.onCompleteArgs);	
		}
	},
	
	getRange: function(d) {
		var i, newXmax=0,newYmin=0;
		for (i=0;i<d[0].data.length;i++) {
			newXmax = Math.max(newXmax, d[0].data[i][0]);
			newYmin = Math.min(newYmin, d[0].data[i][1] + d[1].data[i][1] + d[2].data[i][1]);
		}
		if (d[0].data.length==1) {
			newXmax =	 22000;
			newYmin = -1000;
		}
		return {newXmax: newXmax,newYmin: newYmin};	
	},
	
	updateWageAmount: function(wages) {
		var theMax = calcInterface.thePlot.getAxes().xaxis.max;
		if (wages < 0) wages = Math.round(0);
		if (wages > theMax) wages = Math.round(theMax);
		calcInterface.setInput("wage_input",wages);
		calcInterface.thePlot.setupGrid();
		calcInterface.thePlot.draw();
		var results = calcInterface.changeInput();
		calcInterface.setLabelPosition(wages, results);
	},
	setLabelPosition: function(wages,results) {
		var bMarg = calculator.parms.bottomMargin;
		var leftPercent = (calcInterface.thePlot.pointOffset({x:wages,y:0}).left)/calcInterface.theChart.width();
		if (results) {
			var total = results.eitcResults.lossFromEndOfMPR + results.eitcResults.lossFromEndOfThirdChildTier + results.ctcResults;
			var yPoint = (calcInterface.thePlot.pointOffset({x:0,y:0-total}).top)/calcInterface.theChart.height();
			$("#lossOverlay").css("top", yPoint*100/bMarg + "%");
		}
		var yZero = (calcInterface.thePlot.pointOffset({x:0,y:0}).top)/calcInterface.theChart.height();
		$("#lineOverlay").css("top",yZero*100/bMarg + "%").css("height",(.98-yZero)*100 + "%").css("left",(leftPercent*100) + "%");
		/*$("#labelOverlay").css("width", (calcInterface.labelWidth*2) + "px");*/
		if (leftPercent > 0.6) {
			$("#labelOverlay, #lossOverlay").css("left","").css("textAlign","right").css("right",(1-leftPercent)*100 + "%");
			$("#lossOverlay .circle").css({"right":"-6px","left":""});
		} else {
			$("#labelOverlay, #lossOverlay").css("right","").css("textAlign","left").css("left",(leftPercent)*100 + "%");
			$("#lossOverlay .circle").css({"right":"0px","left":"-6px"});
		}
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
		$("span#lossOverlayAmount").html("-$" + calcInterface.addCommas(Math.round(eitcResults.lossFromEndOfThirdChildTier + eitcResults.lossFromEndOfMPR + ctcResults)));
		return {eitcResults: eitcResults, ctcResults: ctcResults};
	}
};


$(document).ready(function() {
	
	calcInterface.theChart = $("#flotChart");
	calcInterface.theChart.find().addBack().on("selectstart",function(e) {
		e.preventDefault();
	});
	calcInterface.theChart.css("height",0.6*$("#flotChart").width());
	
	calculator.parms.chartOptions.colors = [];
	calculator.parms.chartOptions.colors[1] = $("#outputsWrapper .thirdChildTier .legendLabel").css("backgroundColor");
	calculator.parms.chartOptions.colors[2] = $("#outputsWrapper .marriagePenalty .legendLabel").css("backgroundColor");
	calculator.parms.chartOptions.colors[0] = $("#outputsWrapper .ctc .legendLabel").css("backgroundColor");
	
	calcInterface.theChart.bind("plotclick",calcInterface.plotClickFunction);
	
	var ev = calculator.parms.events;
	$(document).on(ev.down,function(e) {
		$("#chartSurrounder").on(ev.move,calcInterface.wrapperMouseMoveFunction);
		calcInterface.mouseIsDown = true;
	});
	$(document).on(ev.up,function(e) {
		$("#chartSurrounder").off(ev.move,calcInterface.wrapperMouseMoveFunction);
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
	
	//calcInterface.labelWidth = $("#labelOverlay").width();
	
	//$("#chartSurrounder").on(ev.move,calcInterface.wrapperMouseMoveFunction);
	
	
	
	$(window).resize(function() {
		calcInterface.theChart.css("height",0.6*$("#flotChart").width());
		$("#chartSurrounder").height(calcInterface.theChart.height()*calculator.parms.bottomMargin);
		$("#flotChart .flot-tick-label").css("font-size",Math.min(calcInterface.theChart.height()/10,16) + "px");
		calcInterface.updateWageAmount($("#wage_input").val());
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
	$(window).trigger("resize");
	
});