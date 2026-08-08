FROM node:22-alpine

WORKDIR /app
COPY server.js ./
COPY index.html styles.css app.js ./public/
COPY assets/cat-meow.mp3 assets/peek-cat-side-tight.png assets/peek-cat-top-tight.png assets/peek-cat-bottom-tight.png ./public/assets/

ENV NODE_ENV=production
ENV STATIC_ROOT=/app/public
EXPOSE 8080
USER node

CMD ["node", "server.js"]
