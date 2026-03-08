function detect_seleniumbase() {
    // Human Safety Gate: Must have webdriver=true, otherwise not Selenium
    try {
        if (navigator.webdriver !== true) {
            return false;
        }
    } catch (e) {
        return false;
    }
    
    var indicators = 0;
    var seleniumbaseSpecific = 0;
    
    try {
        // Check 1: ChromeDriver artifacts ($cdc_ or $wdc_ on document)
        // This is the KEY differentiator from selenium_driverless
        var hasChromeDriverArtifacts = false;
        var docProps = Object.getOwnPropertyNames(document);
        
        for (var i = 0; i < docProps.length; i++) {
            var prop = docProps[i];
            if ((prop.indexOf('$cdc_') === 0) || (prop.indexOf('$wdc_') === 0)) {
                hasChromeDriverArtifacts = true;
                break;
            }
        }
        
        // Also check document properties directly
        if (!hasChromeDriverArtifacts) {
            var docKeys = Object.keys(document);
            for (var j = 0; j < docKeys.length; j++) {
                var key = docKeys[j];
                if ((key.indexOf('$cdc_') === 0) || (key.indexOf('$wdc_') === 0)) {
                    hasChromeDriverArtifacts = true;
                    break;
                }
            }
        }
        
        if (hasChromeDriverArtifacts) {
            indicators++;
            seleniumbaseSpecific++;
        }
        
        // Check 2: No CDP WebSocket indicators (seleniumbase uses chromedriver, not CDP)
        var hasCDPIndicators = false;
        var windowProps = Object.getOwnPropertyNames(window);
        var underscoreCount = 0;
        
        for (var k = 0; k < windowProps.length && k < 100; k++) {
            var wprop = windowProps[k];
            if (wprop && wprop.length > 2 && wprop.charAt(0) === '_' && wprop.charAt(1) === '_') {
                try {
                    var val = window[wprop];
                    if (typeof val === 'function') {
                        underscoreCount++;
                    }
                } catch (e) {
                    // Continue
                }
            }
        }
        
        // Seleniumbase typically has fewer CDP __ functions
        if (underscoreCount < 3) {
            indicators++;
        } else {
            hasCDPIndicators = true;
        }
        
        // Check 3: No Playwright globals (collision prevention)
        var hasPlaywrightGlobals = false;
        var allProps = Object.getOwnPropertyNames(window);
        for (var m = 0; m < allProps.length; m++) {
            var pname = allProps[m];
            if (pname.indexOf('__playwright') === 0 || pname.indexOf('__pw_') === 0) {
                hasPlaywrightGlobals = true;
                break;
            }
        }
        
        if (!hasPlaywrightGlobals) {
            indicators++;
        }
        
        // Check 4: No Puppeteer globals (collision prevention)
        var hasPuppeteerGlobals = false;
        for (var n = 0; n < allProps.length; n++) {
            var p2name = allProps[n];
            if (p2name.indexOf('__puppeteer') === 0) {
                hasPuppeteerGlobals = true;
                break;
            }
        }
        
        if (!hasPuppeteerGlobals) {
            indicators++;
        }
        
        // Check 5: Chrome-specific properties check
        try {
            if (window.chrome && window.chrome.runtime) {
                // Seleniumbase typically has chrome.runtime
                indicators += 0.5;
            }
        } catch (e) {
            // Silent
        }
        
        // Check 6: No zendriver globals (collision prevention)
        var hasZenGlobals = false;
        for (var p = 0; p < allProps.length; p++) {
            var p3name = allProps[p];
            if (p3name.indexOf('zen') === 0) {
                hasZenGlobals = true;
                break;
            }
        }
        
        if (!hasZenGlobals) {
            indicators += 0.5;
        }
        
    } catch (e) {
        // Error in detection - be conservative
        return false;
    }
    
    // Must have webdriver=true AND chrome artifacts AND no CDP-heavy indicators
    // AND at least 3 supporting indicators
    if (indicators >= 3 && seleniumbaseSpecific >= 1) {
        return true;
    }
    
    return false;
}

export { detect_seleniumbase };