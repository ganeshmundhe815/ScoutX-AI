# 1. Base Node.js image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package definitions
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy frontend source code
COPY . .

# 6. Expose Expo Web port
ENV PORT=8081
EXPOSE 8081

# 7. Start Expo Web server binding to all interfaces
CMD ["npx", "expo", "start", "--web", "--port", "8081"]
