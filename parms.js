// EITC calculator - 2018 expiration changes
// by Nick Kasprak and Bryann DaSilva
// CBPP

// Calculator parameters

var calculator = {};


(function(c) {
	
	//storage for parameters object
	var p = {};
	
	//storage for eitc parameters, indexed by number of children	
	/*Keys:
		eiba:	earned income base amount
		bp:		begin phaseout
		mpr:	marriage penalty relief
		pir:	phasein rate
		por:	phaseout rate
	*/
	
	p.eitc = {
		0:	{
			eiba:	6990,
			bp:		8750,
			mpr:	{
				expiration:	3670,
				arra:		5860
			},
			pir:	{
				expiration:	0.0765,
				arra:		0.0765
			},
			por:	0.0765
		},
		1: {
			eiba:	10490,
			bp:		19240,
			mpr:	{
				expiration:	3670,
				arra:		5860
			},
			pir:	{
				expiration:	0.34,
				arra:		0.34
			},
			por:	0.1598
		},
		2:	{
			eiba:	14730,
			bp:		19240,
			mpr:	{
				expiration:	3670,
				arra:		5860
			},
			pir:	{
				expiration:	0.4,
				arra:		0.4
			},
			por:	0.2106
		},
		3:	{
			eiba:	14730,
			bp:		19240,
			mpr:	{
				expiration:	3670,
				arra:		5860
			},
			pir:	{
				expiration:	0.4,
				arra:		0.45
			},
			por:	0.2106
		}
	};
	
	//storage for child tax credit parameters
	/*Keys:
		pt:		phaseout threshold
		ps:		phaseout step
		pi:		phaseout interval
		a:		per child amount
		r:		rate of refundability
		eif:	earned income floor
	*/
	p.ctc = {
		pt:	{
			single:	75000,
			hoh:	75000,
			mfj:	110000,
			mfs:	55000	
		},
		ps:		50,
		pi:		1000,
		a:		1000,
		r:		.15,
		eif:	{
			expiration:	14700,
			arra:		3000	
		}
	};
	
	p.sd =  {
		single:	6700,
		hoh:	9800,
		mfj:	13400,
		mfs:	6700	
	}
	
	p.ex = 4250;
	
	//list filing statuses in order according to values in selector here for later reference
	p.fsTranslator = ["single","mfj","hoh","mfs"]; 
	
	c.parms = p;
	
})(calculator);

