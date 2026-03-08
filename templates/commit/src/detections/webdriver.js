function detect_webdriver() {
    // Human Safety Gate: Check for webdriver property
    // Humans NEVER have navigator.webdriver = true
    try {
        var descriptor = Object.getOwnPropertyDescriptor(navigator, 'webdriver');
        
        // Check 1: Direct property value (seleniumbase, selenium_driverless)
        if (navigator.webdriver === true) {
            return true;
        }
        
        // Check 2: Descriptor exists and has getter (some frameworks define it this way)
        if (descriptor && typeof descriptor.get === 'function') {
            // Check if getter returns true
            if (descriptor.get() === true) {
                return true;
            }
        }
        
        // Check 3: WebDriver property present in prototype chain
        var proto = Navigator.prototype;
        var protoDescriptor = Object.getOwnPropertyDescriptor(proto, 'webdriver');
        if (protoDescriptor && protoDescriptor.get) {
            try {
                var getterString = protoDescriptor.get.toString();
                // If getter is not native code, it was patched by stealth tools
                if (!getterString.includes('[native code]')) {
                    // This indicates stealth patching (patchright, puppeteer_extra)
                    // BUT humans should not have this, so we need to be careful
                    // Check if the patched getter returns a non-false value
                    var getterResult = protoDescriptor.get.call(navigator);
                    if (getterResult !== false && getterResult !== undefined) {
                        return true;
                    }
                }
            } catch (e) {
                // Silent fail
            }
        }
        
        // Check 4: Look for webdriver in Object.keys (shouldn't exist on real browsers)
        var navigatorKeys = Object.keys(navigator);
        if (navigatorKeys.indexOf('webdriver') >= 0) {
            return true;
        }
        
        // Check 5: ChromeDriver-specific artifacts in document
        var documentProps = Object.getOwnPropertyNames(document);
        for (var i = 0; i < documentProps.length; i++) {
            var prop = documentProps[i];
            if (prop.indexOf('$cdc_') === 0 || prop.indexOf('$wdc_') === 0) {
                return true;
            }
        }
        
    } catch (e) {
        // If any check throws, assume safe (human)
        return false;
    }
    
    // No webdriver evidence found
    return false;
}

export { detect_webdriver };