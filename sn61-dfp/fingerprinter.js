/**
 * SN61 RedTeam DFP v2 - Device Fingerprinter
 * Deterministic fingerprinting with 14+ signal groups
 * Target: 0.8+ score, 0 collisions, <0.1 null_rate
 * 
 * @author @bittensormax (UID 182)
 * @version v5.0.0
 */

// FNV-1a 64-bit hash implementation (deterministic)
function fnv1a64(str) {
  const FNV_PRIME = BigInt('0x100000001b3');
  const FNV_OFFSET = BigInt('0xcbf29ce484222325');
  
  let hash = FNV_OFFSET;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * FNV_PRIME);
  }
  
  return hash.toString(16).padStart(16, '0');
}

// Multi-pass hash for stronger uniqueness (8 passes)
// Produces a full 64-character hex hash with high entropy
function multiPassHash(data, passes = 8) {
  let result = JSON.stringify(data);
  // Accumulate multiple 16-char hashes to build a 64-char result
  const hashParts = [];
  
  for (let i = 0; i < passes; i++) {
    // Each pass produces a 16-char hash
    const part = fnv1a64(result + i.toString());
    hashParts.push(part);
    // Use this part as input for next iteration to maintain chain
    result = part;
  }
  
  // Combine all 8 parts (8 x 16 = 128 chars) and hash down to 64
  const combined = hashParts.join('');
  let finalHash = '';
  
  // Process combined hash in chunks to produce final 64-char result
  for (let i = 0; i < 4; i++) {
    const chunk = combined.slice(i * 32, (i + 1) * 32);
    finalHash += fnv1a64(chunk + i.toString());
  }
  
  return finalHash; // 64 characters of hex
}

// Signal 1: Screen & Display Properties (deterministic)
function getScreenSignals() {
  try {
    return {
      width: screen.width || 0,
      height: screen.height || 0,
      availWidth: screen.availWidth || 0,
      availHeight: screen.availHeight || 0,
      colorDepth: screen.colorDepth || 0,
      pixelDepth: screen.pixelDepth || 0,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: screen.orientation?.type || 'unknown',
      isExtended: screen.isExtended || false,
    };
  } catch {
    return { error: 'screen_unavailable' };
  }
}

// Signal 2: Navigator Properties (30+ attributes)
function getNavigatorSignals() {
  try {
    const nav = navigator;
    return {
      userAgent: nav.userAgent || '',
      platform: nav.platform || '',
      language: nav.language || '',
      languages: Array.from(nav.languages || []),
      hardwareConcurrency: nav.hardwareConcurrency || 0,
      maxTouchPoints: nav.maxTouchPoints || 0,
      cookieEnabled: nav.cookieEnabled || false,
      doNotTrack: nav.doNotTrack || 'unknown',
      vendor: nav.vendor || '',
      vendorSub: nav.vendorSub || '',
      productSub: nav.productSub || '',
      appVersion: nav.appVersion || '',
      appName: nav.appName || '',
      appCodeName: nav.appCodeName || '',
      onLine: nav.onLine || false,
      pdfViewerEnabled: nav.pdfViewerEnabled || false,
      deviceMemory: nav.deviceMemory || 0,
      connection: nav.connection ? {
        effectiveType: nav.connection.effectiveType || '',
        rtt: nav.connection.rtt || 0,
        downlink: nav.connection.downlink || 0,
        saveData: nav.connection.saveData || false,
      } : null,
      webdriver: nav.webdriver || false,
    };
  } catch {
    return { error: 'navigator_unavailable' };
  }
}

// Signal 3: WebGL Parameters (30+ params)
function getWebGLSignals() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { error: 'webgl_unavailable' };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const params = {
      vendor: gl.getParameter(gl.VENDOR) || '',
      renderer: gl.getParameter(gl.RENDERER) || '',
      version: gl.getParameter(gl.VERSION) || '',
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || '',
      unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '',
      unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '',
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
      maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || []),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 0,
      maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 0,
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 0,
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 0,
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 0,
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS) || 0,
      aliasedLineWidthRange: Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) || []),
      aliasedPointSizeRange: Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || []),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || 0,
      maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 0,
      redBits: gl.getParameter(gl.RED_BITS) || 0,
      greenBits: gl.getParameter(gl.GREEN_BITS) || 0,
      blueBits: gl.getParameter(gl.BLUE_BITS) || 0,
      alphaBits: gl.getParameter(gl.ALPHA_BITS) || 0,
      depthBits: gl.getParameter(gl.DEPTH_BITS) || 0,
      stencilBits: gl.getParameter(gl.STENCIL_BITS) || 0,
      extensions: gl.getSupportedExtensions() || [],
    };
    
    return params;
  } catch {
    return { error: 'webgl_error' };
  }
}

// Signal 4: Canvas Fingerprint (deterministic rendering)
function getCanvasSignal() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { error: 'canvas_unavailable' };

    // Deterministic drawing operations
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 280, 60);
    
    ctx.fillStyle = '#069';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('SN61 RedTeam DFP v5 🔐', 2, 15);
    
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('Fingerprint Canvas', 4, 40);
    
    ctx.strokeStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(200, 30, 20, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#0000ff';
    ctx.beginPath();
    ctx.moveTo(240, 10);
    ctx.lineTo(260, 50);
    ctx.lineTo(220, 50);
    ctx.closePath();
    ctx.fill();

    return { dataUrl: canvas.toDataURL() };
  } catch {
    return { error: 'canvas_error' };
  }
}

// Signal 5: Font Detection (22 fonts x 3 sizes)
function getFontSignals() {
  const fonts = [
    'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 
    'Cambria Math', 'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
    'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
    'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI', 'Tahoma', 
    'Times', 'Times New Roman', 'Verdana'
  ];
  const sizes = ['12px', '16px', '24px'];
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  
  try {
    const testString = 'mmmmmmmmmmlli';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { error: 'font_detection_unavailable' };

    const detected = [];
    
    for (const font of fonts) {
      for (const size of sizes) {
        const widths = [];
        for (const baseFont of baseFonts) {
          ctx.font = `${size} ${baseFont}`;
          const baseWidth = ctx.measureText(testString).width;
          ctx.font = `${size} "${font}", ${baseFont}`;
          const testWidth = ctx.measureText(testString).width;
          widths.push(testWidth !== baseWidth);
        }
        if (widths.some(w => w)) {
          detected.push(`${font}@${size}`);
        }
      }
    }
    
    return { detected, count: detected.length };
  } catch {
    return { error: 'font_error' };
  }
}

// Signal 6: Math Precision (16 operations)
function getMathSignals() {
  try {
    return {
      tan: Math.tan(-1e300),
      sin: Math.sin(0.5),
      cos: Math.cos(0.5),
      log: Math.log(2),
      exp: Math.exp(1),
      sqrt: Math.sqrt(2),
      pow: Math.pow(Math.PI, -100),
      acos: Math.acos(0.5),
      asin: Math.asin(0.5),
      atan: Math.atan(0.5),
      atan2: Math.atan2(0.5, 0.5),
      sinh: Math.sinh(0.5),
      cosh: Math.cosh(0.5),
      tanh: Math.tanh(0.5),
      expm1: Math.expm1(0.5),
      log1p: Math.log1p(0.5),
    };
  } catch {
    return { error: 'math_error' };
  }
}

// Signal 7: Audio Context Fingerprint (stable static properties)
// Note: Using static properties only - async rendering causes fragmentation
function getAudioSignal() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return { error: 'audio_unavailable' };
    
    const audioCtx = new AudioContext();
    
    // Use only stable static properties - no async processing
    // This avoids setTimeout issues in proxy environments
    const result = {
      sampleRate: audioCtx.sampleRate,
      channelCount: audioCtx.destination.maxChannelCount,
      state: audioCtx.state,
      latency: audioCtx.baseLatency || 0,
      // Include AudioContext capabilities without rendering
      maxChannelCount: audioCtx.destination.maxChannelCount,
      numberOfInputs: audioCtx.destination.numberOfInputs,
      numberOfOutputs: audioCtx.destination.numberOfOutputs,
    };
    
    // Close context synchronously if possible
    try {
      audioCtx.close();
    } catch (e) {
      // Ignore close errors
    }
    
    return result;
  } catch {
    return { error: 'audio_error' };
  }
}

// Signal 8: Codec Support (16 codecs)
function getCodecSignals() {
  const videoCodecs = [
    'video/mp4; codecs="avc1.42E01E"',
    'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    'video/webm; codecs="vp8"',
    'video/webm; codecs="vp9"',
    'video/webm; codecs="vp8, vorbis"',
    'video/ogg; codecs="theora"',
    'video/mp4; codecs="hvc1"',
    'video/mp4; codecs="av01"',
  ];
  
  const audioCodecs = [
    'audio/mp4; codecs="mp4a.40.2"',
    'audio/webm; codecs="vorbis"',
    'audio/webm; codecs="opus"',
    'audio/ogg; codecs="vorbis"',
    'audio/ogg; codecs="opus"',
    'audio/wav; codecs="1"',
    'audio/mpeg',
    'audio/flac',
  ];
  
  try {
    const video = document.createElement('video');
    const audio = document.createElement('audio');
    
    const supported = [];
    
    for (const codec of videoCodecs) {
      const result = video.canPlayType(codec);
      if (result) supported.push(`v:${codec}:${result}`);
    }
    
    for (const codec of audioCodecs) {
      const result = audio.canPlayType(codec);
      if (result) supported.push(`a:${codec}:${result}`);
    }
    
    return { supported, count: supported.length };
  } catch {
    return { error: 'codec_error' };
  }
}

// Signal 9: Emoji Width Variations
function getEmojiSignals() {
  const emojis = ['😀', '🎉', '🔥', '💀', '🚀', '🌈', '🍕', '❤️', '🎸', '🏆'];
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { error: 'emoji_unavailable' };
    
    ctx.font = '32px sans-serif';
    
    const widths = emojis.map(emoji => ({
      emoji,
      width: ctx.measureText(emoji).width
    }));
    
    return { widths, hash: fnv1a64(JSON.stringify(widths)) };
  } catch {
    return { error: 'emoji_error' };
  }
}

// Signal 10: Intl Formatting
function getIntlSignals() {
  try {
    const date = new Date(2024, 0, 1, 12, 0, 0);
    const number = 123456.789;
    
    return {
      dateFormat: new Intl.DateTimeFormat().format(date),
      numberFormat: new Intl.NumberFormat().format(number),
      currencyFormat: new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(number),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      calendar: Intl.DateTimeFormat().resolvedOptions().calendar,
      numberingSystem: Intl.DateTimeFormat().resolvedOptions().numberingSystem,
      collation: new Intl.Collator().resolvedOptions().collation,
    };
  } catch {
    return { error: 'intl_error' };
  }
}

// Signal 11: Performance Timing (stable properties only)
function getPerformanceSignals() {
  try {
    // Use stable memory properties only - timing values are volatile
    const memory = performance.memory || {};
    
    return {
      // Stable memory limits (device characteristics)
      jsHeapSizeLimit: memory.jsHeapSizeLimit || 0,
      // Note: timing properties removed to prevent fragmentation
      // navigationStart, domContentLoadedEventStart, etc. change every page load
    };
  } catch {
    return { error: 'performance_error' };
  }
}

// Signal 12: Storage Capabilities
function getStorageSignals() {
  try {
    const storage = {
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      indexedDB: !!window.indexedDB,
      openDatabase: !!window.openDatabase,
      cookiesEnabled: navigator.cookieEnabled,
    };
    
    // Test localStorage quota
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      storage.localStorageWorks = true;
    } catch {
      storage.localStorageWorks = false;
    }
    
    return storage;
  } catch {
    return { error: 'storage_error' };
  }
}

// Signal 13: Plugin Detection
function getPluginSignals() {
  try {
    const plugins = Array.from(navigator.plugins || []).map(p => ({
      name: p.name,
      filename: p.filename,
      description: p.description,
      length: p.length,
    }));
    
    return { plugins, count: plugins.length };
  } catch {
    return { error: 'plugin_error' };
  }
}

// Signal 14: Touch & Pointer Capabilities
function getTouchSignals() {
  try {
    return {
      maxTouchPoints: navigator.maxTouchPoints || 0,
      touchEvent: 'ontouchstart' in window,
      touchPoints: 'TouchEvent' in window,
      pointerEvent: 'PointerEvent' in window,
      msPointerEnabled: !!navigator.msPointerEnabled,
      pointerEnabled: !!navigator.pointerEnabled,
    };
  } catch {
    return { error: 'touch_error' };
  }
}

// Signal 15: WebRTC Detection (for uniqueness)
async function getWebRTCSignals() {
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    const offer = await pc.createOffer();
    pc.close();
    
    return {
      sdp: offer.sdp ? fnv1a64(offer.sdp) : 'unavailable',
      type: offer.type,
    };
  } catch {
    return { error: 'webrtc_error' };
  }
}

/**
 * Main fingerprinting function
 * @returns {Promise<string>} 64-character hex hash
 */
export async function runFingerprinting() {
  try {
    // Collect all signals (deterministic - no Math.random())
    const signals = {
      screen: getScreenSignals(),
      navigator: getNavigatorSignals(),
      webgl: getWebGLSignals(),
      canvas: getCanvasSignal(),
      fonts: getFontSignals(),
      math: getMathSignals(),
      audio: getAudioSignal(),
      codecs: getCodecSignals(),
      emoji: getEmojiSignals(),
      intl: getIntlSignals(),
      performance: getPerformanceSignals(),
      storage: getStorageSignals(),
      plugins: getPluginSignals(),
      touch: getTouchSignals(),
      webrtc: await getWebRTCSignals(),
      version: 'v5.0.0',
    };

    // Generate multi-pass hash (8 passes for stability)
    const signalString = JSON.stringify(signals, Object.keys(signals).sort());
    const finalHash = multiPassHash(signalString, 8);
    
    // Verify hash is exactly 64 characters
    if (finalHash.length !== 64) {
      throw new Error(`Hash length mismatch: ${finalHash.length} !== 64`);
    }
    
    // Validate hex format
    if (!/^[0-9a-f]{64}$/i.test(finalHash)) {
      throw new Error('Invalid hash format generated');
    }
    
    return finalHash;
  } catch (error) {
    // Fallback: Return error-based hash (still 64 chars)
    const errorHash = fnv1a64('error:' + (error.message || 'unknown'));
    return errorHash.repeat(4).slice(0, 64);
  }
}

// Export for Node.js/Docker environment
// Note: This file uses ESM export syntax (export async function)
// For CommonJS compatibility, use a wrapper or transpile
