#!/usr/bin/env bash
set -x
set -e
set -o errexit

sudo apt update && sudo apt-get install -y \
  silversearcher-ag \
  tmux \
  neovim \
  iputils-ping

if [ ! -d "$HOME/.tmux/plugins/tpm" ]; then
  git clone https://github.com/tmux-plugins/tpm $HOME/.tmux/plugins/tpm
fi

if [ ! -f "$HOME/.tmux.conf" ]; then
  # wget https://ipfs.anagolay.network/ipfs/QmdZFrnc6NwzKSQdxkZfxHaBXMDH3ndhtwSm7dB7L1NXvM -O $HOME/.tmux.conf
  ln -sf /workspace/git-gpg-remote-sign/devops/.tmux.conf $HOME/.tmux.conf
fi
