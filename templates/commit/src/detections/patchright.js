function detect_patchright() {
    // Human Safety Gate: webdriver must be false for CDP tools
    try {
        if (navigator.webdriver === true) {
            return false;
        }
    } catch (e) {
        return false;
    }
    
    var indicators = 0;
    var patchrightSpecific = 0;
    
    try {
        var windowProps = Object.getOwnPropertyNames(window);
        
        // Check 1: NO __playwright* globals (Patchright strips these)
        var hasPlaywrightGlobals = false;
        for (var i = 0; i < windowProps.length; i++) {
            var prop = windowProps[i];
            if (prop.indexOf('__playwright') === 0 || prop.indexOf('__pw_') === 0) {
                hasPlaywrightGlobals = true;
                break;
            }
        }
        
        if (!hasPlaywrightGlobals) {
            indicators++;
            patchrightSpecific += 0.5;
        } else {
            // Has Playwright globals - this is Playwright, not Patchright
            return false;
        }
        
        // Check 2: Navigator.prototype.webdriver getter is PATCHED (non-native)
        // This is the KEY differentiator for Patchright
        var webdriverPatched = false;
        try {
            var proto = Navigator.prototype;
            var descriptor = Object.getOwnPropertyDescriptor(proto, 'webdriver');
            if (descriptor && descriptor.get) {
                var getterStr = descriptor.get.toString();
                // If getter does NOT contain native code, it was patched
                if (getterStr.indexOf('[native code]') < 0) {
                    webdriverPatched = true;
                    indicators += 2;
                    patchrightSpecific += 2;
                }
            }
        } catch (e) {
            // Silent
        }
        
        if (!webdriverPatched) {
            // Webdriver getter is native - likely not Patchright
            return false;
        }
        
        // Check 3: CDP __ native bindings present
        var cdpBindings = 0;
        for (var j = 0; j < windowProps.length && j < 200; j++) {
            var wprop = windowProps[j];
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
        
        // Check 4: No Puppeteer globals
        var hasPuppeteer = false;
        for (var k = 0; k < windowProps.length; k++) {
            if (windowProps[k].indexOf('__puppeteer') === 0) {
                hasPuppeteer = true;
                break;
            }
        }
        
        if (!hasPuppeteer) {
            indicators++;
        } else {
            return false;
        }
        
        // Check 5: No zendriver globals
        var hasZen = false;
        for (var m = 0; m < windowProps.length; m++) {
            var pname = windowProps[m];
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
        
        // Check 6: No ChromeDriver artifacts
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
        
        // Check 7: Error stack analysis
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
        
    } catch (e) {
        return false;
    }
    
    // Key requirements: patched webdriver getter + no Playwright globals + CDP bindings
    if (indicators >= 5 && patchrightSpecific >= 2) {
        return true;
    }
    
    return false;
}

export { detect_patchright };