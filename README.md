# remote GPG sign mainly for for git


## How to use this thing??

Following is the `docker-compose.yml` file which will spin the signing repo. You **MUST** provide the keys ( for now since it is a PoC ) as a mount in the `/keys` path:
```yaml
version: '3'
services:
  server:
    image: woss/remote-pgp-server
    volumes:
      - ./keys:/keys
    ports:
      - 3000:3000
```

Expose the port as you see fit, it must be `3000` internally. 

Next step is to download the [`./src/signer.js`](./src/signer.js) and put is somewhere.  If you have changed the ports and IP address make sure you change it there too.

Change the git to look like this, make sure the path of the signer is correct. 
```ini
[gpg]
program = /workspace/git-pgp-remote-sign/src/signer.js
[tag]
forceSignAnnotated = true
[commit]
gpgsign = true
```

you can test the `signer.js` bu executing it and writing something in the `stdio` then CTRL+C or CTRL+D to stop it. 

```sh
git add yoourfile
git commit -m 'commiting with remote gpg signing'
git push
```

P.S. THIS IS MADE WITH GITPOT :) AND THE SIGNATURES WORK. NO PRICATE KEYS ON THE GITPOD SERVERS. YOU CONTROL WHERE THEY ARE AND IN THE FUTURE HOW THEY CAN BE ACCESSED. 

This is the PoC  build in one day and if this makes sense there is lot of improvement to be done, from the security and chooseing the correct key.

For now let me know what do you think via twitter, or gitpod discord. 


## Good ref links

* https://git.gnupg.org/cgi-bin/gitweb.cgi?p=gnupg.git;a=blob;f=doc/DETAILS;hb=HEAD#l323
* https://stackoverflow.com/questions/58442313/can-i-sign-git-commits-with-keybase-io/71002961#71002961
* https://docs.openpgpjs.org/
* https://github.com/git/git/blob/master/gpg-interface.c#L917
* https://github.com/git/git/blob/master/Documentation/config/gpg.txt#L1