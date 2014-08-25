// EITC calculator - 2018 expiration changes
// by Nick Kasprak and Bryann DaSilva
// CBPP

(function(c) {
	c.eitcCalculator = function(theInputs, sConfig) { //Calculates EITC
	
		var child3Scenario, fs, gross_amount, kids, less_amount, parms, marriage_penalty_relief, 
		mprScenario, wages, wages_rounded;
		
		//Pull in config options - need to separate these so that we can isolate amounts from each//
		child3Scenario = sConfig.thirdChild;	
		mprScenario = sConfig.marriagePenaltyRelief;
		
		//Pull in inputs
		wages = theInputs.wages;
		fs = theInputs.filingStatus;
		kids = theInputs.numChildren;
		
		//Married filing separately - no EITC for you
		if (fs==3) return 0; 
		
		//Round off wages per IRS table
		wages_rounded = (wages==0 ? 0 : Math.floor(wages/50)*50 + 25);
		
		//Pull in EITC parameters
		parms = this.parms.eitc[kids];
		
		//Find marriage penalty relief amount
		marriage_penalty_relief = (fs == 1) ? parms.mpr[mprScenario] : 0;
		
		//Total potential EITC
		gross_amount = Math.min(wages_rounded,parms.eiba)*parms.pir[child3Scenario];
		
		//Minus phaseout amount
		less_amount = Math.max(0,(wages_rounded - (parms.bp + marriage_penalty_relief))*parms.por);
		
		return Math.round(Math.max(0, gross_amount - less_amount),0);
		
	};
	
	c.findEitcChangeAmounts = function(theInputs) {
		
		//Calculate amount with full extension of ARRA first,
		//then without marriage penalty relief, and then finally
		//without the third child tier, and report the differences.
		
		var amounts = {
			arraFullExtensionAmount: this.eitcCalculator(theInputs,{
				thirdChild:"arra",
				marriagePenaltyRelief:"arra"
			}),
		 	amountWithNoMPR: this.eitcCalculator(theInputs,{
				thirdChild:"arra",
				marriagePenaltyRelief:"expiration"
			}),
		 	amountWithNothing: this.eitcCalculator(theInputs,{
				thirdChild:"expiration",
				marriagePenaltyRelief:"expiration"
			})
		};
		
		return {
			lossFromEndOfMPR:				amounts.arraFullExtensionAmount - amounts.amountWithNoMPR,
			lossFromEndOfThirdChildTier:		amounts.amountWithNoMPR - amounts.amountWithNothing
		};
	};
	
	c.actcCalculator = function(theInputs, scenario) { //Calculates additional CTC
		
		var agi, children, earnedIncomeOverThreshold, exemption, filingStatus, maximumRefundablePortion, parms, 
		phaseoutLoss, phaseoutThreshold, overPhaseout, standardDeduction, totalCTC;
		
		//Pull in inputs
		children = theInputs.numChildren;
		filingStatus = this.parms.fsTranslator[theInputs.filingStatus];
		wages = theInputs.wages;
		
		//and parameters
		parms = this.parms.ctc;
		exemption = this.parms.ex;	
		standardDeduction = this.parms.sd[filingStatus];
		phaseoutThreshold = parms.pt[filingStatus];
	
		//calculate adjusted gross income	
		agi = Math.max(0,wages - standardDeduction - 
			exemption*(1 + children + (filingStatus=="mfj") ? 1 : 0));
		
		//amount over agi phaseout threshold	
		overPhaseout = Math.max(0,Math.floor((agi - phaseoutThreshold)/parms.pi)*parms.pi);
		phaseoutLoss = (parms.ps/parms.pi)*overPhaseout;
		
		//total possible child tax credit
		totalCTC = children*parms.a - phaseoutLoss;
		
		//assumption to show maximum possible loss: no tax to reduce, entire credit is refundable
		
		//amount over earned income threshhold (goes up in 2018)
		earnedIncomeOverThreshold = Math.max(0,wages - parms.eif[scenario]);
		
		//maximum possible refundable credit
		maximumRefundablePortion = earnedIncomeOverThreshold*parms.r;
		
		//assume entire credit has to be refundable.
		return Math.round(Math.min(maximumRefundablePortion,totalCTC));
	}
	
	c.findActcChangeAmounts = function(theInputs) {
		
		//Same drill as before with EITC - calculate with ARRA, then without, report difference
		var amounts = {
			arraFullExtensionAmount:		this.actcCalculator(theInputs,"arra"),
			amountWithHighCTCPhaseIn:	this.actcCalculator(theInputs,"expiration"),
		}
		
		return amounts.arraFullExtensionAmount - amounts.amountWithHighCTCPhaseIn;
	};
	
})(calculator);