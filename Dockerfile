FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
CMD ["npm", "start"]
