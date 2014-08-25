// EITC calculator - 2018 expiration changes
// by Nick Kasprak and Bryann DaSilva
// CBPP

(function(c) {
	c.eitcCalculator = function(theInputs, sConfig) {
		
		var child3Scenario, fs, gross_amount, kids, less_amount, parms, marriage_penalty_relief, mprScenario, wages, wages_rounded;
		
		child3Scenario = sConfig.thirdChild;
		mprScenario = sConfig.marriagePenaltyRelief;
		
		wages = theInputs.wages;
		fs = theInputs.filingStatus;
		kids = theInputs.numChildren;
		
		if (fs==3) return 0; //Married filing separately
		
		wages_rounded = (wages==0 ? 0 : Math.floor(wages/50)*50 + 25);
		parms = this.parms.eitc[kids];
		marriage_penalty_relief = (fs == 1) ? parms.mpr[mprScenario] : 0;
		
		gross_amount = Math.min(wages_rounded,parms.eiba)*parms.pir[child3Scenario];
		
		less_amount = Math.max(0,(wages_rounded - (parms.bp + marriage_penalty_relief))*parms.por	);
		
		return Math.round(Math.max(0, gross_amount - less_amount),0);
		
	};
	
	c.findEitcChangeAmounts = function(theInputs) {
		
		var amounts = {
			arraFullExtensionAmount: 		this.eitcCalculator(theInputs,{thirdChild:"arra",marriagePenaltyRelief:"arra"}),
		 	amountWithNoMPR: 				this.eitcCalculator(theInputs,{thirdChild:"arra",marriagePenaltyRelief:"expiration"}),
		 	amountWithNothing: 				this.eitcCalculator(theInputs,{thirdChild:"expiration",marriagePenaltyRelief:"expiration"})
		};
		
		return {
			lossFromEndOfMPR:				amounts.arraFullExtensionAmount - amounts.amountWithNoMPR,
			lossFromEndOfThirdChildTier:		amounts.amountWithNoMPR - amounts.amountWithNothing
		};
	};
	
	c.actcCalculator = function(theInputs, scenario) {
		
		var agi, children, earnedIncomeOverThreshold, exemption, filingStatus, maximumRefundablePortion, parms, standardDeduction, phaseoutLoss, phaseoutThreshold, overPhaseout, totalCTC;
		parms = this.parms.ctc;		
		children = theInputs.numChildren;
		filingStatus = this.parms.fsTranslator[theInputs.filingStatus];
		standardDeduction = this.parms.sd[filingStatus];
		exemption = this.parms.ex;
		agi = Math.max(0,theInputs.wages - standardDeduction - exemption*(1 + children + (filingStatus=="mfj") ? 1 : 0));
		phaseoutThreshold = parms.pt[filingStatus];
		overPhaseout = Math.max(0,Math.floor((agi - phaseoutThreshold)/parms.pi)*parms.pi);
		phaseoutLoss = (parms.ps/parms.pi)*overPhaseout;
		totalCTC = children*parms.a - phaseoutLoss;
		earnedIncomeOverThreshold = Math.max(0,theInputs.wages - parms.eif[scenario]);
		maximumRefundablePortion = earnedIncomeOverThreshold*parms.r;
		
		//assumption to show maximum possible loss: no tax to reduce, entire credit is refundable
		return Math.round(Math.min(maximumRefundablePortion,totalCTC));
	}
	
	c.findActcChangeAmounts = function(theInputs) {
		var amounts = {
			arraFullExtensionAmount:		this.actcCalculator(theInputs,"arra"),
			amountWithHighCTCPhaseIn:	this.actcCalculator(theInputs,"expiration"),
		}
		
		return amounts.arraFullExtensionAmount - amounts.amountWithHighCTCPhaseIn;
	};
	
})(calculator);