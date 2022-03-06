import { includes, indexOf, isEmpty, isNil, split, trim } from 'ramda';

import { IAcceptedStrategies, log } from './config';
/**
 * Git gpg possible outcomes for calling this script
 */
export type PossibleOutcomes = 'sign' | 'verify';

/**
 * Obtain the API-KEY from APPROVED_API_KEY env variable. throw error if not found
 * @returns
 */
export async function findApiKey(): Promise<string> {
	log.trace('Finding API-KEY key ...');
	const { APPROVED_API_KEY } = process.env;
	if (!isNil(APPROVED_API_KEY) && !isEmpty(APPROVED_API_KEY)) {
		return APPROVED_API_KEY;
	} else {
		throw new Error('APIKEY not found');
	}
}

/**
 * Check do we run on the minimum required nodejs version. If we do, continue, if we do not throw Error
 * @param minVersion number - defaults to 16
 */
export async function checkSupportedNodejsVersion(minVersion: number = 16): Promise<void> {
	log.trace('Checking the nodejs version ...');
	const { node } = process.versions;
	const [runtimeNodeVersionAsString] = split('.')(trim(node));
	const currentNodeVersion = parseInt(runtimeNodeVersionAsString, 10);
	if (currentNodeVersion < minVersion) {
		throw new Error(`NODEJS runtime version is too low ${node}, needed ${minVersion}`);
	}
	log.trace(`    Nodejs : ${currentNodeVersion}>=${minVersion}`);
}

/**
 * Parse the arguments and returns the outcome, sign or verify
 * @internal
 */
export async function parseArguments(): Promise<{
	executionMode: PossibleOutcomes;
	path: string;
	strategy: IAcceptedStrategies;
}> {
	log.trace('Parsing arguments ...');

	// we don't need first 2 items
	const args = process.argv.slice(2);
	if (isEmpty(args)) {
		throw new Error('Signer script called without arguments');
	} else {
		// Signing signer.js --status-fd=2 -bsau 3595E4B1EB3363FB7C4F78CC12F55F75B1EB0FA4
		if (includes('--status-fd=2', args) && includes('-bsau', args)) {
			log.trace(`    Got the command to sign ${process.argv.join(' ')}`);

			return { executionMode: 'sign', path: '', strategy: 'gpg' };
		}
		// Verification ./signer.js --keyid-format=long --status-fd=1 --verify /tmp/.git_vtag_tmpxmPdqZ -
		else if (
			includes('--keyid-format=long', args) &&
			includes('--status-fd=1', args) &&
			includes('--verify', args)
		) {
			log.trace(`    Got the command to verify ${process.argv.join(' ')}`);
			const idxOfVerify = indexOf('--verify', args);
			return { executionMode: 'verify', path: args[idxOfVerify + 1], strategy: 'gpg' };
		} else {
			log.error(`Got else arm. that should not happen, here are args ${args}`);
			throw new Error(`Got else arm. that should not happen, here are args ${args}`);
		}
	}
}
