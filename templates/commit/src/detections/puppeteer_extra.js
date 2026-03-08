function detect_puppeteer_extra() {
    // Human Safety Gate: webdriver must be false for CDP tools
    try {
        if (navigator.webdriver === true) {
            return false;
        }
    } catch (e) {
        return false;
    }
    
    var indicators = 0;
    var extraSpecific = 0;
    
    try {
        var windowProps = Object.getOwnPropertyNames(window);
        
        // Check 1: Look for __puppeteer* globals
        var hasPuppeteerGlobals = false;
        for (var i = 0; i < windowProps.length; i++) {
            if (windowProps[i].indexOf('__puppeteer') === 0) {
                hasPuppeteerGlobals = true;
                break;
            }
        }
        
        if (hasPuppeteerGlobals) {
            indicators += 1.5;
        }
        
        // Check 2: Error stack has pptr:// markers
        try {
            var err = new Error('test');
            var stack = err.stack || '';
            if (stack.indexOf('pptr://') >= 0) {
                indicators += 1.5;
            }
        } catch (e) {
            // Silent
        }
        
        // Check 3: Function.prototype.toString is PATCHED
        // This is the KEY differentiator for puppeteer_extra (stealth plugin)
        var toStringPatched = false;
        try {
            var fnToStr = Function.prototype.toString;
            var fnToStrResult = fnToStr.call(fnToStr);
            // If result does NOT contain native code, it's been wrapped
            if (fnToStrResult.indexOf('[native code]') < 0) {
                toStringPatched = true;
                indicators += 2;
                extraSpecific += 2;
            }
        } catch (e) {
            // Silent
        }
        
        // Must have patched toString
        if (!toStringPatched) {
            return false;
        }
        
        // Check 4: No Playwright globals
        var hasPlaywright = false;
        for (var j = 0; j < windowProps.length; j++) {
            var prop = windowProps[j];
            if (prop.indexOf('__playwright') === 0 || prop.indexOf('__pw_') === 0) {
                hasPlaywright = true;
                break;
            }
        }
        
        if (!hasPlaywright) {
            indicators++;
        } else {
            return false;
        }
        
        // Check 5: No zendriver globals
        var hasZen = false;
        for (var k = 0; k < windowProps.length; k++) {
            var pname = windowProps[k];
            if (pname.length >= 3 && pname.charAt(0) === 'z' && pname.charAt(1) === 'e' && pname.charAt(2) === 'n') {
                hasZen = true;
                break;
            }
        }
        
        if (!hasZen) {
            indicators += 0.5;
        } else {
            return false;
        }
        
        // Check 6: CDP bindings present
        var cdpBindings = 0;
        for (var m = 0; m < windowProps.length && m < 200; m++) {
            var wprop = windowProps[m];
            if (wprop && wprop.length > 2 && wprop.charAt(0) === '_' && wprop.charAt(1) === '_') {
                try {
                    var val = window[wprop];
                    if (typeof val === 'function') {
                        var fnStr = val.toString();
                        if (fnStr.indexOf('[native code]') >= 0) {
                            cdpBindings++;
                        }
                    }
                } catch (e) {
                    // Continue
                }
            }
        }
        
        if (cdpBindings >= 2) {
            indicators++;
        }
        
        // Check 7: No ChromeDriver artifacts
        var hasChromeArtifacts = false;
        var docProps = Object.getOwnPropertyNames(document);
        for (var n = 0; n < docProps.length; n++) {
            var dprop = docProps[n];
            if ((dprop.indexOf('$cdc_') === 0) || (dprop.indexOf('$wdc_') === 0)) {
                hasChromeArtifacts = true;
                break;
            }
        }
        
        if (!hasChromeArtifacts) {
            indicators += 0.5;
        } else {
            return false;
        }
        
        // Check 8: Navigator webdriver getter might be patched
        try {
            var proto = Navigator.prototype;
            var descriptor = Object.getOwnPropertyDescriptor(proto, 'webdriver');
            if (descriptor && descriptor.get) {
                var getterStr = descriptor.get.toString();
                if (getterStr.indexOf('[native code]') < 0) {
                    indicators += 0.5;
                }
            }
        } catch (e) {
            // Silent
        }
        
    } catch (e) {
        return false;
    }
    
    // Key: patched toString + multiple confirmations
    if (indicators >= 5 && extraSpecific >= 2) {
        return true;
    }
    
    return false;
}

export { detect_puppeteer_extra };