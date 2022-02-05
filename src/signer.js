#!/usr/bin/env node

import { request } from 'http'

async function main() {
	const options = {
		hostname: '127.0.0.1',
		port: 3000,
		path: '/sign',
		method: 'POST',
		headers: {
			'Content-type': "text/plain"
		}
	}

	process.stdin.on("data", async (data) => {
		const commitMsg = data;

		const  { signature } = await new Promise(async (resolve) => {
			const req = request(options, res => {
				res.on('data', d =>
					resolve(JSON.parse(d.toString()))
				)
			})

			req.on('error', error => {
				console.error('ERRORRRR', error)
			})

			req.write(commitMsg)
			req.end()
		})

	

		// logger.info(`[GNUPG:] KEY_CONSIDERED ${privateKey.getKeyID().toHex()} 0`)
		// // process.stdout.write(`[GNUPG:] KEY_CONSIDERED ${privateKey.getKeyID().toHex()} 0`)

		// logger.info("[GNUPG:] BEGIN_SIGNING H10")
		// // process.stdout.write("[GNUPG:] BEGIN_SIGNING H10")
		// somehow this must be in the sterr so git can recognize it
		process.stderr.write(`\n[GNUPG:] SIG_CREATED `);
		// this must be written to the stdout so git can pick up the signature
		process.stdout.write(signature);
	});
	return;
}

main();
