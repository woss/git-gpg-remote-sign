# remote GPG sign mainly for for git

**DISCLAIMER**

THIS IS THE PROOF-OF-CONCEPT USE AT YOUR OWN RISK :)

**DISCLAIMER**

## Questions:

> Are my keys secure?

That depends on, is your sever secure.

> Do you (woss) host my keys?

Nope, i don't host your keys or the server, you should do it yourself.

> any other questions ask on https://twitter.com/woss_io

---

### Run the server

Following is the `docker-compose.yml` file which will spin the signing repo. You **MUST** provide the keys ( for now since it is a PoC ) as a mount in the `/keys` path:

```yaml
version: "3"
services:
  server:
    image: woss/remote-signer-server
    volumes:
      - ./keys:/keys
    ports:
      - 3000:3000
```

Expose the port as you see fit, it must be `3000` internally.

### Get the signer

Modify this to suits your need:

```
sudo sh -c 'curl https://ipfs.anagolay.network/ipfs/QmVwR17T5oT4SsH1gb8T9L9gHe5CsJz2iwhbhWCwPPHgHR > /usr/local/bin/remote-signer && chmod +x /usr/local/bin/remote-signer'
```

### Set the env variables

If you are using the GITPOD you should set the variable with the `*/*` permission.

```bash
# where your service is running
export GIT_REMOTE_SIGN_URL=https://your-service.com

# only set this if you don't want to add the git.user.signingKey
# variable or that somehow doesn't work
export GPG_SIGN_KEY=YOUR_FULL_LENGTH_KEY_ID
```

### Change the gitconfig

For now, this approach only works if you:

1. have the signing key set with 40 characters(full key id and not 16)
2. the public key is available through the https://keys.openpgp.org

Here is my [testing key](https://keys.openpgp.org/search?q=3595E4B1EB3363FB7C4F78CC12F55F75B1EB0FA4), when you click the link you can see the link below the search, that is what the signer will look for and download the public key.

Now when you all that, change the gitconfig to match this:

```ini
[user]
name = Daniel Maricic
email = daniel@woss.io
# signingKey = 7A6DB9962EF3978E # this is my main key, only last 16 chars
signingKey = 3595E4B1EB3363FB7C4F78CC12F55F75B1EB0FA4 # this is my new full length testing key for p2p git signing
[gpg]
program = remote-signer
[tag]
forceSignAnnotated = true
[commit]
gpgsign = true
```

There is a log file generated in the `~/.logs/remote-signer/git-signer.log` which you can tail like this:

```bash
tail -f ~/.logs/remote-signer/git-signer.log
```

you can test the `remote-signer` bu executing it and writing something in the `stdio` then CTRL+C or CTRL+D to stop it.

```sh
git add your-file
git commit -m 'commiting with remote gpg signing'
git push

```

P.S. MOST OF THIS IS MADE WITH GITPOD :) AND THE SIGNATURES WORK. NO PRIVATE KEYS ON THE GITPOD SERVERS. YOU CONTROL WHERE THEY ARE AND IN THE FUTURE HOW THEY CAN BE ACCESSED.

This is the PoC build in one day and if this makes sense there is lot of improvement to be done, from the security and choosing the correct key.

## Debugging

```bash
# this is the most important one
export GIT_TRACE=true

# super super optional
export GIT_CURL_VERBOSE=true
export GIT_SSH_COMMAND="ssh -vvv"
export GIT_TRACE_PACK_ACCESS=true
export GIT_TRACE_PACKET=true
export GIT_TRACE_PACKFILE=true
export GIT_TRACE_PERFORMANCE=true
export GIT_TRACE_SETUP=true
export GIT_TRACE_SHALLOW=true
```

## Good ref links

- https://git.gnupg.org/cgi-bin/gitweb.cgi?p=gnupg.git;a=blob;f=doc/DETAILS;hb=HEAD#l323
- https://stackoverflow.com/questions/58442313/can-i-sign-git-commits-with-keybase-io/71002961#71002961
- https://docs.openpgpjs.org/
- https://github.com/git/git/blob/master/gpg-interface.c#L917
- https://github.com/git/git/blob/master/Documentation/config/gpg.txt#L1
