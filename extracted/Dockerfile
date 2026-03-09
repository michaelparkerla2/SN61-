# SN61 RedTeam DFP v2 - Docker Image
# Deterministic fingerprinting for Bittensor Subnet 61
# Author: @bittensormax (UID 182)

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for headless browser testing
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy fingerprinter code
COPY fingerprinter.js ./
COPY test-local.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Entry point - run fingerprinting
CMD ["node", "-e", "const { runFingerprinting } = require('./fingerprinter.js'); runFingerprinting().then(hash => { console.log('FINGERPRINT:', hash); process.exit(0); }).catch(err => { console.error('ERROR:', err); process.exit(1); })"]
