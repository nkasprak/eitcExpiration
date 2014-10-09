var fTracker = {
	fontsLoaded: false,
	windowLoaded: false	
};
try	{
	Typekit.load({
		active: function() {
			fTracker.fontsLoaded = true;
			if (fTracker.fontsLoaded && fTracker.windowLoaded) {
				calcInterface.pageLoadFunction();		
			}
		}
	});
} catch(e) {}