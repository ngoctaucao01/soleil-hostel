# Development Dockerfile for frontend (Vite)
FROM node:20

WORKDIR /app

# Install deps first using package.json for caching
COPY package*.json ./
RUN npm install --legacy-peer-deps || true

# Copy source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
