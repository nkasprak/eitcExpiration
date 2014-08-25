


$(document).ready(function() {
	
	$("table#inputs :input").change(function() {
		var theInputs, results;
		
		theInputs = {};
		theInputs.wages = $("#wage_input").val();
		theInputs.numChildren = $("#children_input").val();
		theInputs.filingStatus = $("#fs_input").val();
		
		results = calculator.findEitcChangeAmounts(theInputs);
		
		$("span#result_thirdChildTier").html("$" + results.lossFromEndOfThirdChildTier);
		$("span#result_marriagePenalty").html("$" + results.lossFromEndOfMPR);
		
		
	});
});