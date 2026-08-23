# 1. Base Node.js image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package definitions
COPY package*.json ./

# 4. Install production dependencies
RUN npm install --production

# 5. Copy source code
COPY . .

# 6. Expose port (Google Cloud Run dynamically assigns PORT)
ENV PORT=5000
EXPOSE 5000

# 7. Start application
CMD ["npm", "start"]
