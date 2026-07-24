FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY package*.json ./

# Install dependencies (including Prisma)
RUN npm install

# Copy source code and prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8001

# Command to run the application
CMD ["npm", "run", "start"]
