# Stage 1: Build React static assets
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Custom nginx template to resolve dynamic port assigned by Cloud Run
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV PORT=3000
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
