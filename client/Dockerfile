# Use official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifest files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining frontend source code
COPY . .

# Expose port 3000 for Vite dev server
EXPOSE 3000

# Start Vite dev server bound to 0.0.0.0 for container networking
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
