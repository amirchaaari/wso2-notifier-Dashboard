# Jenkins already built the dist/ folder — Docker just serves it
# No source code, no Node.js needed here

FROM nginx:1.27-alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy only the pre-built Vite dist produced by Jenkins (npm run build)
COPY dist/ /usr/share/nginx/html

# Copy nginx config for SPA routing + API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
