# Use official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifest files
COPY package*.json ./

# Install dependencies
RUN npm install

# Set default environment variables for build/runtime
ENV DATABASE_URL="file:./dev.db"
ENV PORT=5000
ENV NODE_ENV=development

# Copy Prisma schema and generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy remaining backend source code
COPY . .

# Expose port 5000
EXPOSE 5000

# Push database schema on startup and launch backend server
CMD ["sh", "-c", "npx prisma db push && npm run dev"]
