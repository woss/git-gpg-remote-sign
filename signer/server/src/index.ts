import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { readFile } from 'fs/promises';
import fetch from 'node-fetch';
import * as openpgp from 'openpgp';
import { equals, includes, isEmpty, isNil } from 'ramda';

import { isTrue } from './utils/booleans';

const {
	ENABLE_API_KEY_SUPPORT,
	WOSS_REMOTE_SIGNER_SERVER_PORT,
	APPROVED_API_KEY,
	WOSS_REMOTE_SIGNER_SERVER_ABS_KEYS_PATH,
} = process.env;

/**
 * Location of the keys
 */
const keysAbsLocation: string =
	!isNil(WOSS_REMOTE_SIGNER_SERVER_ABS_KEYS_PATH) && !isEmpty(WOSS_REMOTE_SIGNER_SERVER_ABS_KEYS_PATH)
		? WOSS_REMOTE_SIGNER_SERVER_ABS_KEYS_PATH
		: '/keys';

const port: number =
	!isNil(WOSS_REMOTE_SIGNER_SERVER_PORT) && !isEmpty(WOSS_REMOTE_SIGNER_SERVER_PORT)
		? parseInt(WOSS_REMOTE_SIGNER_SERVER_PORT, 10)
		: 3000;

async function main(): Promise<void> {
	const { privateKey } = await readKeys();
	const app = fastify({
		logger: {
			prettyPrint:
				process.env.NODE_ENV === 'development'
					? {
							translateTime: 'HH:MM:ss Z',
							ignore: 'pid,hostname',
					  }
					: false,
		},
	});

	if (!isNil(ENABLE_API_KEY_SUPPORT) && !isEmpty(ENABLE_API_KEY_SUPPORT) && isTrue(ENABLE_API_KEY_SUPPORT)) {
		console.log('ENABLING THE API-KEY SUPPORT!!!');

		app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
			const skipVerification = ['/', '/healthcheck'];

			if (!includes(request.routerPath)(skipVerification)) {
				const apiKeyFromHEader = request.headers['x-api-key'];
				if (isNil(apiKeyFromHEader) || isEmpty(apiKeyFromHEader)) {
					throw new Error('Did you forget the API key? Set the `x-api-key` header with the correct value.');
				}

				if (!equals(apiKeyFromHEader, APPROVED_API_KEY)) {
					reply.code(401).send(`Your API KEY is not allowed!`);
				}
			}
		});
	} else {
		console.warn('API SUPPORT IS DISABLED, BE CAREFUL NOT TO EXPOSE THIS TO THE PUBLIC!');
	}

	app.get('/', (req, res) => {
		res.send('Hello Remote git GPG signing');
	});

	// eslint-disable-next-line @typescript-eslint/naming-convention
	app.get('/healthcheck', (_req, res) => {
		res.send({ healthy: true, systemTime: Date.now() });
	});

	app.post<{
		Body: {
			signingKey: string;
			msg: string;
		};
	}>('/v1/gpg/sign', async (req, res) => {
		const { signingKey, msg } = req.body;

		const publicKeyArmored = await (
			await fetch(`https://keys.openpgp.org/vks/v1/by-fingerprint/${signingKey}`, { method: 'GET' })
		).text();

		const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

		// get the message from hex to the buffer
		const encMsgBuffer = Buffer.from(msg, 'hex');

		const { data: decrypted } = await openpgp.decrypt({
			message: await openpgp.readMessage({
				binaryMessage: Uint8Array.from(encMsgBuffer), // the binary message expects the Uint8Array
			}),
			verificationKeys: publicKey,
			decryptionKeys: privateKey,
		});

		const message = await openpgp.createMessage({ text: decrypted });
		const detachedSignature = await openpgp.sign({
			message,
			signingKeys: privateKey,
			detached: true,
		});
		const hexSignature = Buffer.from(detachedSignature.toString()).toString('hex');

		res.send({
			hexSignature,
			detachedSignature: detachedSignature.toString(),
		});
	});

	// Run the server!
	try {
		await app.listen(port, '0.0.0.0');
		console.log(`Example app listening on port ${port}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}

/**
 * Read the keys if they exist into the OpenPGP format. It is expected for not that they exist in the he keys folder.
 *
 * Directory must contain the `private.key`, `public.key` and `passphrase` files
 */
async function readKeys(): Promise<{ privateKey: openpgp.PrivateKey; passPhrase: string }> {
	const passPhrase = (await readFile(`${keysAbsLocation}/passphrase`)).toString();

	// const publicKey = await openpgp.readKey({
	//   armoredKey: (await readFile(`/${keysAbsLocation}/public.key`)).toString(),
	// });

	const privateKey = await openpgp.decryptKey({
		privateKey: await openpgp.readPrivateKey({
			armoredKey: (await readFile(`/${keysAbsLocation}/private.key`)).toString(),
		}),
		passphrase: passPhrase,
	});

	return {
		// publicKey,
		privateKey,
		passPhrase,
	};
}

main();
