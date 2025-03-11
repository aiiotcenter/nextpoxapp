# Use the official Node.js image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app source code
COPY . . 

# Expose port 7134
EXPOSE 7134

# Run Next.js in development mode
CMD ["npm", "run", "dev"]