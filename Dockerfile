FROM node:22-slim

WORKDIR /usr/src/app

# Create data directory for SQLite
RUN mkdir -p /usr/src/app/data

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Create an entrypoint script
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Use the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"] 