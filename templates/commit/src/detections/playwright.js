function detect_playwright() {
    // Human Safety Gate: webdriver must be false for CDP tools
    try {
        if (navigator.webdriver === true) {
            return false;
        }
    } catch (e) {
        return false;
    }
    
    var indicators = 0;
    var playwrightSpecific = 0;
    
    try {
        var windowProps = Object.getOwnPropertyNames(window);
        
        // Check 1: Look for __playwright* globals (Playwright-specific)
        var hasPlaywrightGlobals = false;
        var playwrightGlobalCount = 0;
        
        for (var i = 0; i < windowProps.length; i++) {
            var prop = windowProps[i];
            if (prop.indexOf('__playwright') === 0 || prop.indexOf('__pw_') === 0) {
                hasPlaywrightGlobals = true;
                playwrightGlobalCount++;
            }
        }
        
        if (hasPlaywrightGlobals && playwrightGlobalCount >= 1) {
            indicators += 2;
            playwrightSpecific += 2;
        } else {
            // No Playwright globals - not Playwright
            return false;
        }
        
        // Check 2: Verify navigator.webdriver getter is native
        // Playwright does NOT patch the getter (unlike patchright)
        try {
            var proto = Navigator.prototype;
            var descriptor = Object.getOwnPropertyDescriptor(proto, 'webdriver');
            if (descriptor && descriptor.get) {
                var getterStr = descriptor.get.toString();
                if (getterStr.indexOf('[native code]') >= 0) {
                    indicators++;
                }
            }
        } catch (e) {
            // Silent
        }
        
        // Check 3: No Puppeteer globals (collision prevention)
        var hasPuppeteer = false;
        for (var j = 0; j < windowProps.length; j++) {
            if (windowProps[j].indexOf('__puppeteer') === 0) {
                hasPuppeteer = true;
                break;
            }
        }
        
        if (!hasPuppeteer) {
            indicators++;
        } else {
            return false;
        }
        
        // Check 4: No zendriver globals
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
        
        // Check 5: CDP __ bindings presence (confirms CDP tool)
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
        
        // Check 6: Error stack should NOT have pptr:// markers
        try {
            var err = new Error('test');
            var stack = err.stack || '';
            if (stack.indexOf('pptr://') < 0) {
                indicators += 0.5;
            } else {
                return false;
            }
        } catch (e) {
            // Silent
        }
        
        // Check 7: Function.prototype.toString is native
        try {
            var fnToStr = Function.prototype.toString;
            var fnToStrResult = fnToStr.call(fnToStr);
            if (fnToStrResult.indexOf('[native code]') >= 0) {
                indicators += 0.5;
            }
        } catch (e) {
            // Silent
        }
        
    } catch (e) {
        return false;
    }
    
    // Must have Playwright-specific globals and multiple confirmations
    if (indicators >= 4 && playwrightSpecific >= 2) {
        return true;
    }
    
    return false;
}

export { detect_playwright };