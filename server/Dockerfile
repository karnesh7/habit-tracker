# Use official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifest files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema and generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate
RUN npx prisma db push

# Copy remaining backend source code
COPY . .

# Expose port 5000
EXPOSE 5000

# Set environment variables for container
ENV PORT=5000
ENV NODE_ENV=development

# Start backend dev server
CMD ["npm", "run", "dev"]
