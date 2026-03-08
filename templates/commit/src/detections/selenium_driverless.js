function detect_selenium_driverless() {
    // Human Safety Gate: Must have webdriver=true
    try {
        if (navigator.webdriver !== true) {
            return false;
        }
    } catch (e) {
        return false;
    }
    
    var indicators = 0;
    var driverlessSpecific = 0;
    
    try {
        // Check 1: NO ChromeDriver artifacts ($cdc_ or $wdc_)
        // This is the KEY differentiator from seleniumbase
        var hasChromeDriverArtifacts = false;
        var docProps = Object.getOwnPropertyNames(document);
        
        for (var i = 0; i < docProps.length; i++) {
            var prop = docProps[i];
            if ((prop.indexOf('$cdc_') === 0) || (prop.indexOf('$wdc_') === 0)) {
                hasChromeDriverArtifacts = true;
                break;
            }
        }
        
        if (!hasChromeDriverArtifacts) {
            indicators++;
            driverlessSpecific++;
        } else {
            // Has chrome artifacts - definitely seleniumbase, not driverless
            return false;
        }
        
        // Check 2: Check for CDP indicators (selenium_driverless uses CDP directly)
        var cdpIndicators = 0;
        var windowProps = Object.getOwnPropertyNames(window);
        
        for (var j = 0; j < windowProps.length && j < 150; j++) {
            var wprop = windowProps[j];
            if (wprop && wprop.length > 2 && wprop.charAt(0) === '_' && wprop.charAt(1) === '_') {
                try {
                    var val = window[wprop];
                    if (typeof val === 'function') {
                        var fnString = val.toString();
                        if (fnString.indexOf('[native code]') >= 0) {
                            cdpIndicators++;
                        }
                    }
                } catch (e) {
                    // Continue
                }
            }
        }
        
        // Selenium_driverless may have some CDP indicators but fewer than full CDP tools
        if (cdpIndicators >= 2 && cdpIndicators < 8) {
            indicators++;
        }
        
        // Check 3: No Playwright globals (collision prevention)
        var hasPlaywrightGlobals = false;
        for (var k = 0; k < windowProps.length; k++) {
            var pname = windowProps[k];
            if (pname.indexOf('__playwright') === 0 || pname.indexOf('__pw_') === 0) {
                hasPlaywrightGlobals = true;
                break;
            }
        }
        
        if (!hasPlaywrightGlobals) {
            indicators++;
        } else {
            // Has Playwright globals - not selenium_driverless
            return false;
        }
        
        // Check 4: No Puppeteer globals (collision prevention)
        var hasPuppeteerGlobals = false;
        for (var m = 0; m < windowProps.length; m++) {
            var p2name = windowProps[m];
            if (p2name.indexOf('__puppeteer') === 0) {
                hasPuppeteerGlobals = true;
                break;
            }
        }
        
        if (!hasPuppeteerGlobals) {
            indicators++;
        } else {
            return false;
        }
        
        // Check 5: No zendriver globals (collision prevention)
        var hasZenGlobals = false;
        for (var n = 0; n < windowProps.length; n++) {
            var p3name = windowProps[n];
            if (p3name.length >= 3 && p3name.charAt(0) === 'z' && p3name.charAt(1) === 'e' && p3name.charAt(2) === 'n') {
                hasZenGlobals = true;
                break;
            }
        }
        
        if (!hasZenGlobals) {
            indicators += 0.5;
        } else {
            return false;
        }
        
        // Check 6: Error stack trace analysis
        try {
            var stackError = new Error('test');
            var stackStr = stackError.stack || '';
            
            // Check for pptr:// markers (Puppeteer-specific)
            if (stackStr.indexOf('pptr://') < 0) {
                indicators += 0.5;
            } else {
                return false;
            }
        } catch (e) {
            // Silent
        }
        
    } catch (e) {
        return false;
    }
    
    // Must have webdriver=true, NO chrome artifacts, NO framework globals
    // AND at least 3.5 indicators
    if (indicators >= 3.5 && driverlessSpecific >= 1) {
        return true;
    }
    
    return false;
}

export { detect_selenium_driverless };