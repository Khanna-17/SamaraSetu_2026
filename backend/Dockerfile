FROM node:22-bookworm-slim

WORKDIR /app

# Install local toolchain used by the in-house compiler runner
# and apply latest security patches available at build time.
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    openjdk-17-jdk \
    golang \
    rustc \
    cargo \
    kotlin \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/index.js"]
