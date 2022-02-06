FROM gitpod/workspace-full

RUN npm install -g pnpm \
    &&  apt-get update \
    && apt-get install silversearcher-ag