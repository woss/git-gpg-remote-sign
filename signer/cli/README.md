# Server and signer

run the `pnpm watch` to get your build files, then run the server via `pnpm dev`

to use the webpack build with remote server use `pnpm build:signer -- --watch`

don't forget to copy the gitconfig sample

## Useful commands

```sh
# https://git-scm.com/docs/git-verify-commit
git verify-commit --raw -v 33af8e1bd1a9e2231503042a65bc8a0ab557fe50

# https://git-scm.com/docs/git-show#Documentation/git-show.txt---show-signature
# this will call the verify method
git show --show-signature

git log --show-signature
```

## Test repo

```sh
cd ~
mkdir test-repo
git init
echo $(date) > file.txt; git add . ; git commit -m "woss-$(date)"

```
