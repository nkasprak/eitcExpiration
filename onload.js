/* Event Handler Bindings for Tax Credit Interactive Chart
by Nick Kasprak
(c) 2014, Center on Budget and Policy Priorities.*/

calcInterface.pageLoadFunction = function() {		
	calcInterface.theChart = $("#flotChart");
	calcInterface.theChart.find().addBack().on("selectstart",function(e) {
		e.preventDefault();
	});
	calcInterface.theChart.css("height",0.6*$("#flotChart").width());
	
	calculator.parms.chartOptions.colors = [];
	calculator.parms.chartOptions.colors[2] = $("#outputsWrapper .thirdChildTier .legendLabel").css("backgroundColor");
	calculator.parms.chartOptions.colors[1] = $("#outputsWrapper .marriagePenalty .legendLabel").css("backgroundColor");
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
	
	$(".embedLink").click(function() {
		if ($("div.embedCode").is(":visible")) {
			$("div.embedCode").fadeOut(200);
		} else {
			$("div.embedCode").fadeIn(200);	
		}
	});
	
	$("#outputsWrapper .ctc span").qtip({
		content:{
			text:'A family begins to earn the portion of the CTC that it can receive as a refund as their earnings increase above a threshold amount of $3,000.  If this provision expires at the end of 2017, this threshold amount will more than quadruple to $14,700 in 2018.'},
			style:{classes:'explanatoryTip'},
			position:{at:"top left",my:"bottom right",target:"mouse",viewport:$(window)}
	});
	
	$("#outputsWrapper .thirdChildTier span").qtip({content:{text:'Families with three or more children currently are eligible for a larger EITC than families with two children. If this provision expires, larger families would lose up to $737 of their EITC.'},style:{classes:'explanatoryTip',target:"mouse"},
			position:{at:"top left",my:"bottom right",target:"mouse",viewport:$(window)}});
	
	$("#outputsWrapper .marriagePenalty span").qtip({content:{text:'This provision currently allows married couples to receive the EITC at modestly higher income levels than they would otherwise. If this provision expires, many married couples would lose some or all of their EITC.'},style:{classes:'explanatoryTip'},position:{at:"top left",my:"bottom right",target:"mouse",viewport:$(window)}});
	
	$("span.embedDomain").html(document.URL);
	$(window).trigger("resize");
	setTimeout(function() {
		$(window).trigger("resize")
	},2);
};

$(window).on("load",function() {
	fTracker.windowLoaded = true;
	if (fTracker.fontsLoaded && fTracker.windowLoaded) {
		calcInterface.pageLoadFunction();		
	}
});
	