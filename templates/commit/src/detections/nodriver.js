function detect_nodriver() {
    // Human Safety Gate: webdriver must be false for CDP tools
    try {
        if (navigator.webdriver === true) {
        return false;
        }
    } catch (e) {
        return false;
    }
    
    var indicators = 0;
    var nodriverSpecific = 0;
    
    try {
        var windowProps = Object.getOwnPropertyNames(window);
        
        // Check 1: NO framework globals (nodriver has NO framework-specific globals)
        var hasFrameworkGlobals = false;
        for (var i = 0; i < windowProps.length; i++) {
            var prop = windowProps[i];
        if (prop.indexOf('__playwright') === 0 || prop.indexOf('__pw_') === 0 || prop.indexOf('__puppeteer') === 0 || prop.indexOf('__pw_') === 0) {
            hasFrameworkGlobals = true;
            break;
        }
        }
        
        if (!hasFrameworkGlobals) {
            indicators++;
        } else {
            return false;
        }
        
        // Check 2: CDP bindings present (CDP tools have __ functions)
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
        
        // Check 3: No Playwright globals (collision prevention)
        var hasPlaywright = false;
        for (var k = 0; k < windowProps.length; k++) {
            var prop = windowProps[k];
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
        
        // Check 4: No Puppeteer globals (collision prevention)
        var hasPuppeteer = false;
        for (var m = 0; m < windowProps.length; m++) {
            var pname = windowProps[m];
            if (pname.indexOf('__puppeteer') === 0) {
            hasPuppeteer = true;
            break;
            }
        }
        
        if (!hasPuppeteer) {
            indicators++;
        } else {
            return false;
        }
        
        // Check 5: No zendriver globals (collision prevention)
        var hasZen = false;
        for (var n = 0; n < windowProps.length; n++) {
            var pname = windowProps[n];
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
        
        // Check 6: Error stack analysis
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
        
        // Check 7: No ChromeDriver artifacts
        var hasChromeArtifacts = false;
        var docProps = Object.getOwnPropertyNames(document);
        for (var o = 0; o < docProps.length; o++) {
            var dprop = docProps[o];
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
        
        // Check 8: No patched Function.prototype.toString
        try {
            var fnToStr = Function.prototype.toString;
            var fnToStrResult = fnToStr.call(fnToStr);
            if (fnToStrResult.indexOf('[native code]') >= 0) {
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
    
    // Key: NO framework globals + CDP bindings
    if (indicators >= 5 && nodriverSpecific >= 1) {
        return true;
    }
    
    return false;
}

export { detect_nodriver };