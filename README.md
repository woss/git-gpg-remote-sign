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


1. Copy the `cp env.sample .env` and edit it
2. change the `APPROVED_API_KEY` key to something unique, it doesn't need to be uuidv4. there is no limit to the length not format, but i suggest no spaces nor line breaks
3. You **MUST** provide the keys ( for now since it is a PoC ) as a mount in the `/keys` path or you can mount them in a different place byt setting the `WOSS_REMOTE_SIGNER_SERVER_ABS_KEYS_PATH` variable
	1. in `keys` mounted volume 2 files are important `passphrase` and `private.key`
4. Following is the `docker-compose.yml` file which will spin the signing repo

```yaml
version: "3"
services:
  server:
    image: woss/remote-signer-server
    env_file: ./.env
    volumes:
      - ./keys:/keys
    ports:
      - 3000:3000
```

The key, once retrieved is cached in the `~/.cache/remote-signer/FINGERPRINT.asc` and used later. If you didn't broadcast your public key ( i have no idea why you would do that ) then you can create a file with the armored content. 


Expose the port as you see fit, it must be `3000` internally.

### Get the signer

Modify this to suits your need:

```
sudo sh -c 'curl https://ipfs.anagolay.network/ipfs/bafybeigcptua5ztgeydvokh6tsz7noz2cvfd2boxfbolbdgdm7wsajcuom > /usr/local/bin/remote_signer && chmod +x /usr/local/bin/remote_signer'
```

### Set the env variables

If you are using the GITPOD you should set the variable with the `*/*` permission.

```bash
# where your service is running
export GIT_REMOTE_SIGN_URL=https://your-service.com

# only set this if you don't want to add the git.user.signingKey
# variable or that somehow doesn't work
export GPG_SIGN_KEY=YOUR_FULL_LENGTH_KEY_ID

# be really careful where and how you store this. who ever has access to this can acceess your sever
export APPROVED_API_KEY=777da2f3-19a5-425c-b662-79747d0b390c
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
# signingKey = 7A6DB9962EF3128E # this is my main key, only last 16 chars

# this is my new full length testing key for p2p git signing, if this is not set GPG_SIGN_KEY will be used
signingKey = 3595E4B1EB3363FB7C4F78CC12F55F7513EB0FA4 
[gpg]
program = remote_signer
[tag]
forceSignAnnotated = true
[commit]
gpgsign = true
```

There is a log file generated in the `~/.logs/remote-signer/git-signer.log` which you can tail like this:

```bash
tail -f ~/.logs/remote-signer/git-signer.log
```

you can test the `remote_signer` bu executing it then checking the logs where you will see error message 😉

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
