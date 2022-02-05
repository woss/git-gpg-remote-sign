import fastify from "fastify";
import { readFile } from "fs/promises";
import * as openpgp from "openpgp";

const keysAbsLocation = "/keys";
const port = 3000;

async function main() {
  const { privateKey } = await readKeys();
  const app = fastify({ logger: true });
  app.get("/", (req, res) => {
    res.send("Hello Remote git GPG signin");
  });
  app.post("/sign", async (req, res) => {
    const commitMessage = req.body;
    const message = await openpgp.createMessage({ text: commitMessage });
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
  const publicKey = await openpgp.readKey({
    armoredKey: (await readFile(`/${keysAbsLocation}/public.key`)).toString(),
  });
  const privateKey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({
      armoredKey: (
        await readFile(`/${keysAbsLocation}/private.key`)
      ).toString(),
    }),
    passphrase: passPhrase,
  });

  return {
    publicKey,
    privateKey,
    passPhrase,
  };
}

main().catch(console.error);
