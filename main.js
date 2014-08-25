


$(document).ready(function() {
	
	$("table#inputs :input").change(function() {
		var theInputs, results;
		
		theInputs = {};
		theInputs.wages = $("#wage_input").val();
		theInputs.numChildren = $("#children_input").val();
		theInputs.filingStatus = $("#fs_input").val();
		
		eitcResults = calculator.findEitcChangeAmounts(theInputs);
		ctcResults = calculator.findActcChangeAmounts(theInputs);
		
		$("span#result_thirdChildTier").html("$" + eitcResults.lossFromEndOfThirdChildTier);
		$("span#result_marriagePenalty").html("$" + eitcResults.lossFromEndOfMPR);
		$("span#result_ctc").html("$" + ctcResults);
		
	});
});