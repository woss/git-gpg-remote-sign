FROM gitpod/workspace-full

RUN npm install -g pnpm \
    && sudo apt-get update \
    && sudo apt-get install silversearcher-ag