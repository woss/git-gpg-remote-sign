#!/usr/bin/env bash
set -x
set -e
set -o errexit

root="$(git rev-parse --show-toplevel)"

sudo apt update && sudo apt-get install -y \
  silversearcher-ag \
  tmux \
  neovim \
  iputils-ping

if ! command -v pnpm &>/dev/null; then
  echo "pnpm could not be found, i will install it"
  sudo sh -c 'curl https://ipfs.anagolay.network/ipfs/QmeCUX9cK4YKdTbNVq3jg5cJPvz8uQiQmb4AKKd7niy4kY >/usr/local/bin/pnpm &&
  chmod +x /usr/local/bin/pnpm'
fi

if [ ! -d "$HOME/.tmux/plugins/tpm" ]; then
  git clone https://github.com/tmux-plugins/tpm $HOME/.tmux/plugins/tpm
fi

if [ ! -f "$HOME/.tmux.conf" ]; then
  # wget https://ipfs.anagolay.network/ipfs/QmdZFrnc6NwzKSQdxkZfxHaBXMDH3ndhtwSm7dB7L1NXvM -O $HOME/.tmux.conf
  ln -sf $root/devops/.tmux.conf $HOME/.tmux.conf
fi

# install the rush
pnpm add -g @microsoft/rush
