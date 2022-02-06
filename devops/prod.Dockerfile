# base box
FROM node:16-bullseye as base
WORKDIR /app
COPY ./signer .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build


# main box
FROM node:16-alpine as main
WORKDIR /app
COPY --from=base /app/dist/server .
EXPOSE 3000
CMD [ "node", "server.js" ]