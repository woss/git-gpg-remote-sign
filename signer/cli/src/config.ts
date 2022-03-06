import { mkdirSync } from 'fs';
import pino, { Logger } from 'pino';

/**
 * We have implemented these strategies
 */
export type IAcceptedStrategies = 'gpg';

const { GIT_REMOTE_SIGNER_LOG_LEVEL } = process.env;

export const logsDir: string = `${process.env.HOME}/.logs/remote-signer`;
export const cacheDir: string = `${process.env.HOME}/.cache/remote-signer`;

mkdirSync(logsDir, { recursive: true });
mkdirSync(cacheDir, { recursive: true });

export const log: Logger = pino(
	{
		level: GIT_REMOTE_SIGNER_LOG_LEVEL ? GIT_REMOTE_SIGNER_LOG_LEVEL : 'trace',
	},
	pino.destination(`${logsDir}/git-signer.log`)
);
