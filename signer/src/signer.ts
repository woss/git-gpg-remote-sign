import fetch from 'node-fetch';
import * as openpgp from 'openpgp';
import { includes, indexOf, isEmpty, split, startsWith, trim } from 'ramda';
import pino from 'pino';
import { access, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';

const logsDir = `${process.env.HOME}/.logs/remote-signer`;

mkdirSync(logsDir, { recursive: true });

const log = pino(
	{
		level: 'trace',
	},
	pino.destination(`${logsDir}/git-signer.log`)
);

const url = process.env.GIT_REMOTE_SIGN_URL || 'http://127.0.0.1:31111';

/**
 * Does all the stuff needed for the git signing.
 * The commit message will be encrypted and hex encoded before sending over the wire. The server is to decode and then decrypt the message, then sign it and return the sig
 * 
 * 
 * 
 * NOTE: NEVER HAVE ANYTHING THAN THE SIGNATURE RELATED STUFF WRITING THE stdout, GIT WILL PICK IT UP AND ADD AS A SIGNATURE (pretty stupid)
 * 
 * I had the `console.log` while commiting. this happened
 * ```
 * ❯ git log --show-signature
BUG: gpg-interface.c:283: bad signature 'found the key in the args but not in the env                                
{"signingKey":"3595E4B1EB3363FB7C4F78CC12F55F75B1EB0FA4","msg":"c15e030dba0d31cf12ad9712010740d3667931adc42671b85cac1e0984dcb8dd2863d38409ccb9a3531b2d3e54d06030a194f5a2b8e8cc5911346c993c98cedc035fef75ed8626fbb1a02fdf2902bcd6a1552caafcdcf43268357af69b179e00d2c052019dfbe7ec8bd3a7a3866713a00351bdadc7be8c77c6686ab958d2d419af6f9d914101736ec33ec7b22be4a9837f6a2cb2f768fb9ecd399f72a3e938b7335258abb9aa59b90b5e8c5d397f3563cd641944bd4d78d80b25050d35cb43be5a996166448a7b0ae994ccd278451f6540803dc8eb4f25eca615fc99d727c34c05ac5ebc8f6e029d61eca566233a4b817f359d2a02011694e8f123292bffa2b6975f725cc01844120026a64321c53b806482298a190064735420c12a8ab75cdd5a50ab2d82424d244aeaa7fc6a53a520c22316d5383f68248fb5140230d0464fea4ef790f43da3a753ee900a6ad9e0e335b85c46b0edfeb2001ce19b30949689e6b987ba1dd924bf93860cdaba6fae652e9e48dd55"}
-----BEGIN PGP SIGNATURE-----

wnUEARYKAAYFAmH/1OkAIQkQEvVfdbHrD6QWIQQ1leSx6zNj+3xPeMwS9V91
sesPpIexAQDxwbJ4C0Nm7Vc4JEuie/fS7MfRC/xBOZbJ3EVouxQUfQD+M6CT
l1xEuO6oPz++pKII8JZROInUNPtpdivg5BgkYg0=
=8RbP
-----END PGP SIGNATURE-----
'
```
 */
async function main() {
	log.info('Request started');
	try {
		await checkSupportedNodejsVersion();

		const { executionMode, path } = parseArguments();

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
	} catch (error) {
		if (process.env.IS_DEV === '1' || process.env.IS_DEV === 'true') {
			console.log(error);
		}
		// we need to swallow the errors since the git doesn't like to see them
		log.error(error);
	}
}
/**
 * Check do we run on the minimum required nodejs version. If we do, continue, if we do not throw Error
 * @param minVersion number - defaults to 16
 */
async function checkSupportedNodejsVersion(minVersion: number = 16) {
	log.info('Checking the nodejs version ...');
	const { node } = process.versions;
	const [runtimeNodeVersionAsString] = split('.')(trim(node));
	const currentNodeVersion = parseInt(runtimeNodeVersionAsString, 10);
	if (currentNodeVersion < minVersion) {
		throw new Error(
			`NODEJS runtime version is too low ${node}, needed ${minVersion}`
		);
	}
	log.info(`    Nodejs : ${currentNodeVersion}>=${minVersion}`);
}
/**
 * Git gpg possible outcomes for calling this script
 */
type PossibleOutcomes = 'sign' | 'verify';
/**
 * Parse the arguments and returns the outcome, sign or verify
 */
function parseArguments(): { executionMode: PossibleOutcomes; path: string } {
	log.trace('Parsing arguments ...');

	// we don't need first 2 items
	const args = process.argv.slice(2);
	if (isEmpty(args)) {
		throw new Error('Signer script called without arguments');
	} else {
		// Signing signer.js --status-fd=2 -bsau 3595E4B1EB3363FB7C4F78CC12F55F75B1EB0FA4
		if (includes('--status-fd=2', args) && includes('-bsau', args)) {
			log.trace(`    Got the command to sign ${process.argv.join(' ')}`);
			return { executionMode: 'sign', path: '' };
		}
		// Verification ./signer.js --keyid-format=long --status-fd=1 --verify /tmp/.git_vtag_tmpxmPdqZ -
		else if (
			includes('--keyid-format=long', args) &&
			includes('--status-fd=1', args) &&
			includes('--verify', args)
		) {
			log.trace(`    Got the command to verify ${process.argv.join(' ')}`);
			const idxOfVerify = indexOf('--verify', args);
			return { executionMode: 'verify', path: args[idxOfVerify + 1] };
		} else {
			log.error(
				`    Got else arm. that should not happen, here are args ${args}`
			);
		}
	}
}

async function sign(): Promise<void> {
	log.info('Executing script in sign mode');
	const signingKey = findSigningKey();
	// https://davesteele.github.io/gpg/2014/09/20/anatomy-of-a-gpg-key/
	if (signingKey.length != 40) {
		log.info(`signingKey ${signingKey}`);
		log.error('We only support the full length key IDs');
		throw new Error('We only support the full length key IDs');
	}
	const cachedKeyPath = `${process.env.HOME}/.config/${signingKey}.asc`;
	let publicKeyArmored: string = '';

	if (existsSync(cachedKeyPath)) {
		log.trace(`Found cached Armored key here ${cachedKeyPath}, using that`);
		publicKeyArmored = (await readFile(cachedKeyPath)).toString();
	} else {
		publicKeyArmored = await (
			await fetch(
				`https://keys.openpgp.org/vks/v1/by-fingerprint/${signingKey}`,
				{ method: 'GET' }
			)
		).text();
		await writeFile(cachedKeyPath, publicKeyArmored);
		log.trace(
			`Got Public key armored from the openpgp.org. Storing it here ${cachedKeyPath}`
		);
	}

	const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

	process.stdin.on('data', async (data) => {
		log.trace(`Inside the stdin, accepting data "${data}"`);
		// encrypt the message with the public key
		const encrypted = await openpgp.encrypt({
			message: await openpgp.createMessage({ binary: data }), // input as Message object
			encryptionKeys: publicKey,
			format: 'binary',
		});

		log.trace('Commit Message is encrypted, sending to the server ...');
		const body = JSON.stringify({
			signingKey,
			// hex encoding here makes a lot more sense than stringifying
			msg: Buffer.from(encrypted).toString('hex'),
		});
		try {
			// make a sign request
			const response = await fetch(`${url}/sign`, {
				method: 'POST',
				body,
				headers: { 'Content-Type': 'application/json' },
			});

			const { signature } = (await response.json()) as { signature: string };
			log.trace(`Got the signature back from the server ${signature}`);
			// logger.info(`[GNUPG:] KEY_CONSIDERED ${privateKey.getKeyID().toHex()} 0`)
			// // process.stdout.write(`[GNUPG:] KEY_CONSIDERED ${privateKey.getKeyID().toHex()} 0`)

			// logger.info("[GNUPG:] BEGIN_SIGNING H10")
			// // process.stdout.write("[GNUPG:] BEGIN_SIGNING H10")
			// somehow this must be in the sterr so git can recognize it
			process.stderr.write(`\n[GNUPG:] SIG_CREATED `);
			// this must be written to the stdout so git can pick up the signature
			process.stdout.write(signature);
		} catch (error) {
			log.error(error);
		}
	});
}

/**
 * Git invokes the gpg --verify on the `git log --shot-signatures` and this is what gets executed in our script
 * @param signaturePath
 */
async function verify(signaturePath: string) {
	log.info(`Executing script in verify mode with  sigPath ${signaturePath}`);

	// process.stdin.on('data', async (messageBuff) => {
	// try {
	// const message = await openpgp.createMessage({
	// 	text: messageBuff.toString(),
	// });
	// const signatureAsBuf = await readFile(signaturePath);
	// log.info(signatureAsBuf.toString());
	// log.info(new TextEncoder().encode(signatureAsBuf.toString()));
	// const signature = await openpgp.readSignature({
	// 	binarySignature: signatureAsBuf,
	// });
	// log.info(signature);
	// const publicKeyArmored = await (
	// 	await fetch(
	// 		`https://keys.openpgp.org/vks/v1/by-fingerprint/${signingKey}`,
	// 		{ method: 'GET' }
	// 	)
	// ).text();
	// const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
	// const verificationResult = await openpgp.verify({
	// 	message, // Message object
	// 	signature,
	// 	verificationKeys: publicKey,
	// });
	// const { verified, keyID } = verificationResult.signatures[0];
	// log.info(verificationResult);
	// cheat for now, until you figure out how to format the signture that contains the \n  to armored
	// } catch (error) {
	// 	log.error(error);
	// }
	// });
	process.stdout.write(`\n[GNUPG:] GOODSIG `);
}

/**
 * Search the GPG_SIGN_KEY var for the signing key or the last arg which is passed by the git
 */
function findSigningKey() {
	log.info('Finding signing key ...');
	let signingKey = '';

	// look for the signing key in the env first
	if (process.env.GPG_SIGN_KEY) {
		log.info('    Key found in GPG_SIGN_KEY env variable');
		signingKey = process.env.GPG_SIGN_KEY;
	} else {
		// look for the Signing key in the args
		const args = process.argv.slice(2);
		if (args[0] !== '--status-fd=2' || args[1] !== '-bsau' || !args[2]) {
			log.error('Arguments are bad!');
			throw new Error('Arguments are bad!');
		}
		log.info('    Key found in arguments arg[2]');
		signingKey = args[2];
	}
	return signingKey;
}

main();
