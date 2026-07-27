FROM node:22-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install 9router CLI globally
RUN npm install -g 9router

ENV HOME=/root
EXPOSE 20128

CMD ["9router", "--host", "0.0.0.0", "--no-browser", "--log"]
