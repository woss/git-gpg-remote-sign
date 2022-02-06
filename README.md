# remote GPG sign mainly for for git

## How to use this thing??

### Run the server

Following is the `docker-compose.yml` file which will spin the signing repo. You **MUST** provide the keys ( for now since it is a PoC ) as a mount in the `/keys` path:

```yaml
version: "3"
services:
  server:
    image: woss/remote-gpg-signing-service
    volumes:
      - ./keys:/keys
    ports:
      - 3000:3000
```

Expose the port as you see fit, it must be `3000` internally.

### Get the signer

Modify this to suits your need:

```
curl https://ipfs.anagolay.network/ipfs/QmeXQE6SteQB8LrVZp6YLbhuFcy1LUsFUfXGP3ZQ8NdCgg > ~/bin/remote-signer && chmod +x ~/bin/remote-signer
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
  program = ~/bin/remote-signer
[tag]
  forceSignAnnotated = true
[commit]
  gpgsign = true
```

you can test the `signer.js` bu executing it and writing something in the `stdio` then CTRL+C or CTRL+D to stop it.

```sh
git add your-file
git commit -m 'commiting with remote gpg signing'
git push
```

P.S. THIS IS MADE WITH GITPOT :) AND THE SIGNATURES WORK. NO PRIVATE KEYS ON THE GITPOD SERVERS. YOU CONTROL WHERE THEY ARE AND IN THE FUTURE HOW THEY CAN BE ACCESSED.

This is the PoC build in one day and if this makes sense there is lot of improvement to be done, from the security and chooseing the correct key.

For now let me know what do you think via twitter, or gitpod discord.

## Good ref links

- https://git.gnupg.org/cgi-bin/gitweb.cgi?p=gnupg.git;a=blob;f=doc/DETAILS;hb=HEAD#l323
- https://stackoverflow.com/questions/58442313/can-i-sign-git-commits-with-keybase-io/71002961#71002961
- https://docs.openpgpjs.org/
- https://github.com/git/git/blob/master/gpg-interface.c#L917
- https://github.com/git/git/blob/master/Documentation/config/gpg.txt#L1
