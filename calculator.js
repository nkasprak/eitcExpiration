// EITC calculator - 2018 expiration changes
// by Nick Kasprak and Bryann DaSilva
// CBPP

(function(c) {
	c.eitcCalculator = function(theInputs, sConfig, smooth) { //Calculates EITC
	
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
		if (smooth == false) wages_rounded = (wages==0 ? 0 : Math.floor(wages/50)*50 + 25);
		else wages_rounded = wages;
		
		//Pull in EITC parameters
		parms = this.parms.eitc[kids];
		
		//Find marriage penalty relief amount
		marriage_penalty_relief = (fs == 1) ? parms.mpr[mprScenario] : 0;
		
		//Total potential EITC
		gross_amount = Math.min(wages_rounded,parms.eiba)*parms.pir[child3Scenario];
		
		//Minus phaseout amount
		less_amount = Math.max(0,(wages_rounded - (parms.bp + marriage_penalty_relief))*parms.por);
		
		return Math.max(0, gross_amount - less_amount);
		
	};
	
	c.findEitcChangeAmounts = function(theInputs, smooth) {
		
		if (typeof smooth === "undefined") {
			smooth = false;	
		}
	
		//Calculate amount with full extension of ARRA first,
		//then without marriage penalty relief, and then finally
		//without the third child tier, and report the differences.
		
		var amounts = {
			arraFullExtensionAmount: this.eitcCalculator(theInputs,{
				thirdChild:"arra",
				marriagePenaltyRelief:"arra"
			}, smooth),
		 	amountWithNoMPR: this.eitcCalculator(theInputs,{
				thirdChild:"arra",
				marriagePenaltyRelief:"expiration"
			}, smooth),
		 	amountWithNothing: this.eitcCalculator(theInputs,{
				thirdChild:"expiration",
				marriagePenaltyRelief:"expiration"
			}, smooth)
		};
		
		return {
			lossFromEndOfMPR:				amounts.arraFullExtensionAmount - amounts.amountWithNoMPR,
			lossFromEndOfThirdChildTier:		amounts.amountWithNoMPR - amounts.amountWithNothing
		};
	};
	
	c.actcCalculator = function(theInputs, scenario) { //Calculates additional CTC
		
		var agi, children, earnedIncomeOverThreshold, exemption, filingStatus, maximumRefundablePortion, parms, 
		phaseoutLoss, phaseoutThreshold, overPhaseout, standardDeduction, wages, totalCTC;
		
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
		return Math.min(maximumRefundablePortion,totalCTC);
	};
	
	c.findActcChangeAmounts = function(theInputs) {
		//Same drill as before with EITC - calculate with ARRA, then without, report difference
		var amounts = {
			arraFullExtensionAmount:		this.actcCalculator(theInputs,"arra"),
			amountWithHighCTCPhaseIn:	this.actcCalculator(theInputs,"expiration")
		}
		
		return amounts.arraFullExtensionAmount - amounts.amountWithHighCTCPhaseIn;
	};
	
	//Calculates the slope of a particular function (theCalculator) over an interval (interval)
	c.calcMarginalRate = function(theInputs,theCalculator, interval) {
		
		var baseAmounts,nextAmounts,i,key,newInputs,marginalRates;
		
		//Start of interval
		baseAmounts = theCalculator.call(c,theInputs, true);
		
		//Make copy of inputs object
		newInputs = this.getInputsCopy(theInputs);
		
		//Increase wage input by interval amount
		newInputs.wages = theInputs.wages+interval;
		
		//End of interval
		nextAmounts = theCalculator.call(c,newInputs, true);
		
		//Calculate slope
		if (typeof(nextAmounts) === "object") {
			marginalRates = {};
			for (key in nextAmounts) {
				marginalRates[key] = (nextAmounts[key] - baseAmounts[key])/interval;
			}
		} else {
			marginalRates = (nextAmounts - baseAmounts)/interval;	
		}
		
		return marginalRates;
	};
	
	//Wrappers to call above function with different calculators
	c.eitcMarginalRate = function(theInputs, interval) {
		return c.calcMarginalRate(theInputs,this.findEitcChangeAmounts, interval);
	}
	c.ctcMarginalRate = function(theInputs, interval) {
		return c.calcMarginalRate(theInputs,this.findActcChangeAmounts, interval);
	};
	
	//Get marginal changes of all three functions (the two EITC ones and the CTC)
	c.marginalRate = function(theInputs, interval) {
		return {
			ctc: this.ctcMarginalRate(theInputs, interval),
			eitc: this.eitcMarginalRate(theInputs, interval)
		};
	};
	
	//Makes copy of inputs object, so we can calculate marginal changes without changing it
	c.getInputsCopy = function(theInputs) {
		var newObject, i;
		newObject = {};
		for (i in theInputs) {
			newObject[i] = theInputs[i];	
		}
		return newObject;
	}
	
	//Recursively calculates at various points to isolate kinks in the graph
	c.findMarginalRatesChange = function(theInputs) {
		
		var baseUnit, basePower, listOfChangePoints, filingStatus, children, lowBound, highBound, recursiveLooper, checkRates;
		
		filingStatus = theInputs.filingStatus;
		children = theInputs.numChildren;
		lowBound = 0;
		highBound = 60000;
		baseUnit = 7;
		basePower = 4;
		listOfChangePoints = [];
		
		checkRates = function(oldRates, newRates) {
			var toReturn, tolerance, changes, i;
			toReturn = false;
			tolerance = 0.00001;
			changes = [
				oldRates.ctc - newRates.ctc,
				oldRates.eitc.lossFromEndOfMPR - newRates.eitc.lossFromEndOfMPR,
				oldRates.eitc.lossFromEndOfThirdChildTier - newRates.eitc.lossFromEndOfThirdChildTier
			]
			for (i = 0;i<changes.length;i++) {
				if (Math.abs(changes[i]) > tolerance) toReturn = true;
			}
			return toReturn;	
		}
		
		recursiveLooper = function(power,startPoint) {
			
			var endPoint, toDrillDown, step, oldMargRate, newMargRate,i,wages;
			step = Math.pow(baseUnit,power);
		
			endPoint = startPoint + step*(baseUnit+1);
			if (power == basePower) endPoint = highBound;
			toDrillDown = [];
			oldMargRate = this.marginalRate({wages:startPoint,numChildren:children,filingStatus:filingStatus},step);
			for (wages = startPoint + step; wages <=endPoint;wages = wages + step) {
				
				newMargRate = this.marginalRate({wages:wages,numChildren:children,filingStatus:filingStatus},step);
				
				if (checkRates(oldMargRate, newMargRate)) {
					toDrillDown.push(wages - step);
				}
				oldMargRate = this.marginalRate({wages:wages,numChildren:children,filingStatus:filingStatus},step);
			}
			for (i = 0; i<toDrillDown.length;i++) {
				if (power > 0) {
					recursiveLooper.call(c,power-1,toDrillDown[i]);
				} else {
					listOfChangePoints.push(toDrillDown	[i]);
				}
			}
			
		};
		
		recursiveLooper.call(c,basePower,lowBound);
		
		return listOfChangePoints;
	};

	c.dataTableForChart = function(theInputs) {
		var dataTable, toAdd, changePoints, i, newInputs, results, maxWage;
		dataTable = [];
		toAdd = [];
		changePoints = this.findMarginalRatesChange(theInputs);
		for (i = 0;i<changePoints.length;i++) {
			toAdd.push(changePoints[i]+1);
		}
		changePoints = changePoints.concat(toAdd);
		changePoints.push(0);
		changePoints.sort(function(a,b) {return a-b;});
		changePoints = changePoints.filter(function(elem, pos) {
			return changePoints.indexOf(elem) == pos;
		});
		changePoints.sort(function(a,b) {return a-b;});
		newInputs = this.getInputsCopy(theInputs);
		for (i=0;i<changePoints.length;i++) {
			newInputs.wages = changePoints[i];
			results = [c.findEitcChangeAmounts(newInputs,true),c.findActcChangeAmounts(newInputs)];
			dataTable.push([changePoints[i],Math.round(results[0].lossFromEndOfMPR), Math.round(results[0].lossFromEndOfThirdChildTier), Math.round(results[1])]);
		}
		return dataTable;
	}
	
})(calculator);