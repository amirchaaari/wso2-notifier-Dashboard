# Jenkins already built the dist/ folder — Docker just serves it
# No source code, no Node.js needed here

# Pin the target platform to amd64 (GKE nodes) so the image is correct no matter
# which Jenkins agent / architecture builds it. No RUN steps -> no emulation needed.
FROM --platform=linux/amd64 nginx:1.27-alpine

# Copy the pre-built Vite dist produced by Jenkins (npm run build).
# (Overwrites the default nginx index.html; no need to rm the default page.)
COPY dist/ /usr/share/nginx/html

# Copy nginx config for SPA routing + API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
