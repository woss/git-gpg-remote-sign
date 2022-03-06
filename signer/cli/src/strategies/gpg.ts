import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import fetch from 'node-fetch';
import * as openpgp from 'openpgp';
import { equals, includes, isEmpty, isNil } from 'ramda';

import { apiInfoForStrategy } from '../api';
import { cacheDir, log } from '../config';
import { findApiKey, PossibleOutcomes } from '../utils';

/**
 * This method is called every time when there is incoming signed commit
 * @public
 */
export async function sign(): Promise<void> {
	log.trace('Executing script in sign mode');
	const signingKey = await findSigningKey();
	// https://davesteele.github.io/gpg/2014/09/20/anatomy-of-a-gpg-key/
	if (signingKey.length !== 40) {
		log.trace(`signingKey ${signingKey}`);
		log.error('We only support the full length key IDs');
		throw new Error('We only support the full length key IDs');
	}
	const publicKey = await giveMeArmoredPublicKey(signingKey);

	process.stdin.on('data', async (data) => {
		log.trace(`    Inside the stdin, accepting data "${data}"`);
		// encrypt the message with the public key
		const encrypted = await openpgp.encrypt({
			message: await openpgp.createMessage({ binary: data }), // input as Message object
			encryptionKeys: publicKey,
			format: 'binary',
		});

		log.trace('Commit Message is encrypted, sending to the server ...');
		const body = JSON.stringify({
			signingKey,
			// hex encoding here makes more sense than JSON.stringify
			msg: Buffer.from(encrypted).toString('hex'),
		});
		try {
			const remoteServerUrl = apiInfoForStrategy('gpg');
			// make a sign request
			const response = await fetch(remoteServerUrl.sign, {
				method: 'POST',
				body,
				headers: { 'Content-Type': 'application/json', 'x-api-key': await findApiKey() },
			});

			const { hexSignature } = (await response.json()) as {
				hexSignature: string; // hex encoded detachedSignature
				detachedSignature: string; // raw detachedSignature
			};
			// logger.trace(`[GNUPG:] KEY_CONSIDERED ${privateKey.getKeyID().toHex()} 0`)
			// // process.stdout.write(`[GNUPG:] KEY_CONSIDERED ${privateKey.getKeyID().toHex()} 0`)

			const signature = Buffer.from(hexSignature, 'hex').toString();

			// log.trace('[GNUPG:] BEGIN_SIGNING H10');
			// process.stdout.write('[GNUPG:] BEGIN_SIGNING H10');
			// somehow this must be in the stderr so git can recognize it
			process.stderr.write(`\n[GNUPG:] SIG_CREATED `);
			// this must be written to the stdout so git can pick up the signature

			log.info(`Signature created 0x%s`, hexSignature);
			process.stdout.write(signature);
		} catch (error) {
			log.error(error);
		}
	});
}

/**
 * Main verify method for thig gpg implementation. this will always be triggered for any git cmd that verifies GPG commit sigs
 * @param signaturePath string - Passed by the git, a temp file `/tmp/.git_vtag_tmpgz2nkg`
 * @public
 */
export async function verify(signaturePath: string): Promise<void> {
	log.trace(`Executing script in verify mode with sigPath ${signaturePath}`);
	const signingKey = await findSigningKey();

	process.stdin.on('data', async (messageBuff) => {
		const acceptedMessage = messageBuff.toString();
		log.trace(`    In stdin,  accepting message ${acceptedMessage}`);

		try {
			const signatureAsBuf = await readFile(signaturePath);
			// this is how to fix the stupid \n\n from the temp file.
			// that in the last string literal is the pressed ENTER key , i kid you not, it muxt be like that
			const armoredSignature = `${signatureAsBuf.toString().split('\n').join(`
`)}`;

			const signature = await openpgp.readSignature({
				armoredSignature,
			});
			const publicKey = await giveMeArmoredPublicKey(signingKey);

			const message = await openpgp.createMessage({
				text: acceptedMessage,
			});

			await openpgp.verify({
				message,
				signature,
				verificationKeys: publicKey,
			});

			log.trace('Signature verified.');

			process.stdout.write(`\n[GNUPG:] GOODSIG `);
		} catch (error) {
			log.error(error);
		}
	});
}

/**
 * Return the armored pub key. If fingerprint is passed via param we will return from the local cache or from the openpgp.org.
 * @param signingKey string - We get this either via the arg or env var
 * @internal
 * @returns
 */
async function giveMeArmoredPublicKey(signingKey: string): Promise<openpgp.Key> {
	const cachedKeyPath = `${cacheDir}/${signingKey}.asc`;
	let publicKeyArmored: string = '';

	if (existsSync(cachedKeyPath)) {
		log.trace(`Found cached key here ${cachedKeyPath}, using that`);
		publicKeyArmored = (await readFile(cachedKeyPath)).toString();
	} else {
		publicKeyArmored = await (
			await fetch(`https://keys.openpgp.org/vks/v1/by-fingerprint/${signingKey}`, { method: 'GET' })
		).text();
		await writeFile(cachedKeyPath, publicKeyArmored);
		log.trace(`Got Public key armored from the openpgp.org. Storing it here ${cachedKeyPath}`);
	}

	const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
	return publicKey;
}

/**
 * Search the GPG_SIGN_KEY var for the signing key or the last arg which is passed by the git
 * @internal
 */
async function findSigningKey(): Promise<string> {
	log.trace('Finding signing key ...');
	let signingKey: string = '';
	const { GPG_SIGN_KEY } = process.env;
	// look for the signing key in the env first
	if (!isNil(GPG_SIGN_KEY) && !isEmpty(GPG_SIGN_KEY)) {
		log.trace('    Key found in GPG_SIGN_KEY env variable');
		signingKey = GPG_SIGN_KEY;
	} else {
		// look for the Signing key in the args
		const args = process.argv.slice(2);
		if (includes(' ', args[2])) {
			log.trace(`Key contains spaces "${args[2]}"`);
			throw new Error(`Key contains spaces "${args[2]}"`);
		} else if (!equals('--status-fd=2', args[0]) && !equals('-bsau', args[1]) && !isNil(args[2])) {
			throw new Error(`Arguments are bad! ${args}`);
		} else {
			signingKey = args[2];
		}
	}
	return signingKey;
}

export async function executeStrategy(executionMode: PossibleOutcomes, path: string): Promise<void> {
	switch (executionMode) {
		case 'sign':
			await sign();
			break;
		case 'verify':
			await verify(path);
			break;
		default:
			throw new Error('No default case');
	}
}
