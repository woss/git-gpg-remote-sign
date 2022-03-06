# base box
FROM node:16-bullseye as base
WORKDIR /build

COPY . .

RUN  node common/scripts/install-run-rush.js install \
	&&  node common/scripts/install-run-rush.js rebuild --verbose


# main box
FROM docker.io/node:16-alpine

WORKDIR /remote_signer

COPY --from=base /build/signer/server/dist .
COPY --from=base /build/signer/server/LICENSE .

HEALTHCHECK --interval=30s --timeout=7s CMD curl -f http://127.0.0.1:3000/healthcheck || exit 1

EXPOSE 3000

CMD [ "node", "remote_signer_server.js" ]