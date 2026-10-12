# 1. Base Node.js image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package definitions
COPY package*.json ./

# 4. Install dependencies
RUN npm install --production

# 5. Copy source code
COPY . .

# 6. Ensure uploads directory exists
RUN mkdir -p uploads

# 7. Expose port
ENV PORT=5000
EXPOSE 5000

# 8. Start application
CMD ["npm", "start"]
