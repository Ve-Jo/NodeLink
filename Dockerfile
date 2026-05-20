# Stage 1: Builder - Install dependencies
FROM node:25-alpine AS builder

# Install git (required for npm to install dependencies from GitHub)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available) to leverage Docker cache
# Use wildcards to ensure both package.json and package-lock.json (or yarn.lock/pnpm-lock.yaml) are copied
COPY package.json ./

# Install production dependencies
# This command automatically handles package-lock.json if it exists, otherwise it creates one.
# For Bun, you might use 'bun install --production'.
RUN npm install

# Stage 2: Runner - Copy application code and run
FROM node:25-alpine

# Set working directory
WORKDIR /app

# Optional Bun runtime for experiments (fallback to Node if unavailable).
RUN npm install -g bun@latest || true

# Copy production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the rest of the application source code
# This includes the 'src' directory, default config, and package files for runtime information.
COPY src/ ./src/
COPY config.default.js ./config.default.js
COPY config.js ./config.js
COPY package.json ./package.json

# Expose the default NodeLink port.
EXPOSE 2333

# Set environment variables for configuration.
ENV NODELINK_SERVER_HOST=0.0.0.0 \
    NODELINK_CLUSTER_ENABLED=true \
    CLUSTER_WORKERS=1 \
    NODELINK_WORKER_MAX_OLD_SPACE_MB=192 \
    NODELINK_SOURCE_WORKER_MAX_OLD_SPACE_MB=128 \
    NODELINK_RUNTIME=node

# Railway injects PORT at runtime; pass it into NodeLink config.
CMD ["sh", "-c", "export NODELINK_SERVER_PORT=${PORT:-2333}; if [ \"${NODELINK_RUNTIME}\" = \"bun\" ]; then if command -v bun >/dev/null 2>&1; then export NODELINK_SERVER_USEBUNSERVER=${NODELINK_SERVER_USEBUNSERVER:-true}; exec npm run start:bun; else echo \"[WARN] NODELINK_RUNTIME=bun requested, but bun binary is unavailable. Falling back to node.\"; fi; fi; exec npm start"]
