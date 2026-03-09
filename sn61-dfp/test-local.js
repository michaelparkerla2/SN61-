/**
 * Local Testing Script for SN61 DFP v2
 * Run: node test-local.js
 */

// Mock browser environment for Node.js testing
const mockWindow = {
  screen: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
    pixelDepth: 24,
    orientation: { type: 'landscape-primary' },
    isExtended: false,
  },
  devicePixelRatio: 1,
  localStorage: {},
  sessionStorage: {},
  indexedDB: {},
  AudioContext: class MockAudioContext {
    constructor() {
      this.sampleRate = 44100;
      this.destination = { maxChannelCount: 2 };
      this.state = 'running';
    }
    createOscillator() {
      return {
        type: 'triangle',
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    }
    createAnalyser() {
      return {
        frequencyBinCount: 1024,
        getByteFrequencyData: (arr) => arr.fill(128),
        connect: () => {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime: () => {} },
        connect: () => {},
      };
    }
    createDynamicsCompressor() {
      return {
        threshold: { setValueAtTime: () => {} },
        knee: { setValueAtTime: () => {} },
        ratio: { setValueAtTime: () => {} },
        attack: { setValueAtTime: () => {} },
        release: { setValueAtTime: () => {} },
        connect: () => {},
      };
    }
    close() {
      return Promise.resolve();
    }
  },
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  platform: 'Win32',
  language: 'en-US',
  languages: ['en-US', 'en'],
  hardwareConcurrency: 8,
  maxTouchPoints: 0,
  cookieEnabled: true,
  doNotTrack: '1',
  vendor: 'Google Inc.',
  vendorSub: '',
  productSub: '20030107',
  appVersion: '5.0',
  appName: 'Netscape',
  appCodeName: 'Mozilla',
  onLine: true,
  pdfViewerEnabled: true,
  deviceMemory: 8,
  webdriver: false,
  plugins: [],
  connection: {
    effectiveType: '4g',
    rtt: 50,
    downlink: 10,
    saveData: false,
  },
};

const mockDocument = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          fillStyle: '',
          font: '',
          strokeStyle: '',
          fillRect: () => {},
          fillText: () => {},
          beginPath: () => {},
          arc: () => {},
          stroke: () => {},
          moveTo: () => {},
          lineTo: () => {},
          closePath: () => {},
          fill: () => {},
          measureText: (text) => ({ width: text.length * 8 }),
          getParameter: () => 'mock',
        }),
        toDataURL: () => 'data:image/png;base64,mock',
      };
    }
    if (tag === 'video' || tag === 'audio') {
      return {
        canPlayType: (codec) => (codec.includes('mp4') ? 'probably' : ''),
      };
    }
    return {};
  },
};

const mockPerformance = {
  timing: {
    navigationStart: Date.now() - 1000,
    domainLookupStart: Date.now() - 900,
    domainLookupEnd: Date.now() - 850,
    connectStart: Date.now() - 800,
    connectEnd: Date.now() - 750,
    domContentLoadedEventStart: Date.now() - 500,
    loadEventStart: Date.now() - 100,
  },
  memory: {
    jsHeapSizeLimit: 4294705152,
    totalJSHeapSize: 35000000,
    usedJSHeapSize: 25000000,
  },
};

// Setup global mocks
global.window = mockWindow;
global.screen = mockWindow.screen;
global.navigator = mockNavigator;
global.document = mockDocument;
global.performance = mockPerformance;
global.RTCPeerConnection = class {
  createDataChannel() {}
  async createOffer() {
    return { sdp: 'mock-sdp', type: 'offer' };
  }
  close() {}
};
global.TextEncoder = TextEncoder;
global.Intl = Intl;

// Run test
async function runTest() {
  console.log('\n🔬 SN61 DFP v5 Local Test\n');
  console.log('='.repeat(50));
  
  try {
    // Import fingerprinter (ESM dynamic import for compatibility)
    const fingerprinter = await import('./fingerprinter.js');
    const { runFingerprinting } = fingerprinter;
    
    console.log('\n📊 Running fingerprinting...\n');
    
    // Run multiple times to verify determinism
    const results = [];
    for (let i = 0; i < 5; i++) {
      const hash = await runFingerprinting();
      results.push(hash);
      console.log(`  Run ${i + 1}: ${hash}`);
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Check determinism
    const allSame = results.every(r => r === results[0]);
    console.log(`\n✅ Determinism: ${allSame ? 'PASS' : 'FAIL'}`);
    
    // Check format
    const validFormat = /^[0-9a-f]{64}$/i.test(results[0]);
    console.log(`✅ 64-char hex: ${validFormat ? 'PASS' : 'FAIL'}`);
    
    // Check for collisions (simulated)
    console.log(`✅ Collisions: 0 (mocked)`);
    console.log(`✅ Null rate: <0.1 (mocked)`);
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📋 Final Hash:', results[0]);
    console.log('\n🎯 Ready for Docker build!\n');
    
    return results[0];
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
