import fastify from "fastify";
import { readFile } from "fs/promises";
import * as openpgp from "openpgp";
import fetch from 'node-fetch';


const keysAbsLocation = "/home/daniel/projects/woss/git-pgp-remote-sign/keys";
const port = 3000;

async function main() {
  const { privateKey } = await readKeys();
  const app = fastify({
    logger: {
      prettyPrint:
        process.env.NODE_ENV === 'development'
          ? {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
          : false
    }
  });
  app.get("/", (req, res) => {
    res.send("Hello Remote git GPG signing");
  });
  app.post<{
    Body: {
      signingKey: string,
      msg: string
    }
  }>("/sign", async (req, res) => {
    const { signingKey, msg } = req.body;

    const publicKeyArmored = await (await fetch(`https://keys.openpgp.org/vks/v1/by-fingerprint/${signingKey}`, { method: 'GET' })).text()

    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    // get the message from hex to the buffer
    const encMsgBuffer = Buffer.from(msg, 'hex')

    const { data: decrypted, signatures } = await openpgp.decrypt({
      message: await openpgp.readMessage({
        binaryMessage: Uint8Array.from(encMsgBuffer) // the binary message expects the Uint8Array
      }),
      verificationKeys: publicKey,
      decryptionKeys: privateKey
    });

    console.log('signatures', signatures);

    const message = await openpgp.createMessage({ text: decrypted });
    const detachedSignature = await openpgp.sign({
      message,
      signingKeys: privateKey,
      detached: true,
    });

    res.send({ signature: detachedSignature });
  });



  // Run the server!
  const start = async () => {
    try {
      await app.listen(port);
      console.log(`Example app listening on port ${port}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}

/**
 * Read the keys if they exist into the OpenPGP format. It is expected for not that they exist in the he keys folder.
 *
 * Directory must contain the `private.key`, `public.key` and `passphrase` files
 */
async function readKeys() {
  const passPhrase = (
    await readFile(`${keysAbsLocation}/passphrase`)
  ).toString();

  // const publicKey = await openpgp.readKey({
  //   armoredKey: (await readFile(`/${keysAbsLocation}/public.key`)).toString(),
  // });

  const privateKey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({
      armoredKey: (
        await readFile(`/${keysAbsLocation}/private.key`)
      ).toString(),
    }),
    passphrase: passPhrase,
  });

  return {
    // publicKey,
    privateKey,
    passPhrase,
  };
}

main().catch(console.error);
