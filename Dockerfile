# RedTeam SN61 ADA Detection v2 Submission
# Docker image for browser automation detection

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy detection files
COPY templates/commit/src/detections/ ./templates/commit/src/detections/

# Create package.json for ES modules
RUN echo '{"type": "module"}' > package.json

# The detection scripts are standalone and will be loaded by the validator
# No CMD needed - validator will load individual files
CMD ["node", "-e", "console.log('ADA Detection v2 Module Ready')"]