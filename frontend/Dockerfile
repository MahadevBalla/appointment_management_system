FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve via Nginx
FROM nginx:1.25-alpine

# Clear default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
