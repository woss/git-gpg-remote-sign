FROM node:16-alpine

EXPOSE 3000

WORKDIR /app

COPY package.json src/server.js /app/

RUN npm install --production

CMD [ "node", "server.js" ]