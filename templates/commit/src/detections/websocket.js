function detect_websocket() {
    // Human Safety Gate: WebSocket CDP connection detection
    // Humans typically don't have CDP WebSocket connections open
    
    var cdpIndicators = 0;
    var totalChecks = 0;
    
    try {
        // Check 1: Look for __ prefixed native functions (CDP injection marker)
        var windowProps = Object.getOwnPropertyNames(window);
        var underscoreFunctions = 0;
        var nativeUnderscoreFunctions = 0;
        
        for (var i = 0; i < windowProps.length && i < 200; i++) {
            try {
                var propName = windowProps[i];
                if (propName && propName.length > 2 && propName.charAt(0) === '_' && propName.charAt(1) === '_') {
                    var propVal = window[propName];
                    if (typeof propVal === 'function') {
                        underscoreFunctions++;
                        var fnString = propVal.toString();
                        if (fnString.indexOf('[native code]') >= 0) {
                            nativeUnderscoreFunctions++;
                        }
                    }
                }
            } catch (e) {
                // Continue
            }
        }
        totalChecks++;
        // CDP tools inject many __ functions with native code
        if (underscoreFunctions >= 3 && nativeUnderscoreFunctions >= 2) {
            cdpIndicators++;
        }
        
        // Check 2: WebSocket constructor analysis
        try {
            totalChecks++;
            var wsDescriptor = Object.getOwnPropertyDescriptor(window, 'WebSocket');
            if (wsDescriptor) {
                // Check if WebSocket is configurable (CDP tools sometimes lock it)
                if (wsDescriptor.configurable === false) {
                    cdpIndicators++;
                }
                
                // Analyze the WebSocket prototype
                var wsProto = WebSocket.prototype;
                var wsProtoKeys = Object.getOwnPropertyNames(wsProto);
                
                // Look for CDP-specific modifications
                for (var j = 0; j < wsProtoKeys.length; j++) {
                    var key = wsProtoKeys[j];
                    if (key.indexOf('__') === 0) {
                        cdpIndicators += 0.5;
                        break;
                    }
                }
            }
        } catch (e) {
            // Silent fail
        }
        
        // Check 3: MessageChannel constructor analysis
        try {
            totalChecks++;
            if (typeof MessageChannel === 'function') {
                var mcDescriptor = Object.getOwnPropertyDescriptor(window, 'MessageChannel');
                var mcProto = MessageChannel.prototype;
                var mcKeys = Object.getOwnPropertyNames(mcProto);
                
                // CDP tools may add properties to MessageChannel
                if (mcKeys.length > 2) {
                    for (var k = 0; k < mcKeys.length; k++) {
                        if (mcKeys[k].indexOf('__') === 0) {
                            cdpIndicators++;
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            // Silent fail
        }
        
        // Check 4: PerformanceObserver analysis
        try {
            totalChecks++;
            if (typeof PerformanceObserver === 'function') {
                var poProto = PerformanceObserver.prototype;
                var poKeys = Object.getOwnPropertyNames(poProto);
                
                // Check for CDP markers on PerformanceObserver
                for (var m = 0; m < poKeys.length; m++) {
                    if (poKeys[m].indexOf('__') === 0) {
                        cdpIndicators++;
                        break;
                    }
                }
                
                // Check constructor string
                var poString = PerformanceObserver.toString();
                if (poString.indexOf('[native code]') < 0) {
                    cdpIndicators += 0.5;
                }
            }
        } catch (e) {
            // Silent fail
        }
        
    } catch (e) {
        // Major exception - be conservative
        return false;
    }
    
    // Require at least 2 indicators AND majority of checks passed
    if (cdpIndicators >= 2 && totalChecks >= 3) {
        return true;
    }
    
    return false;
}

export { detect_websocket };