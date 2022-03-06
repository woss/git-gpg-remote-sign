import { isEmpty, isNil } from 'ramda';

import { IAcceptedStrategies } from './config';

/**
 * Api urls for given strategy.
 *
 * If not in the `GIT_REMOTE_SIGN_URL` then `http://127.0.0.1:3000`.
 * @public
 */
export function apiInfoForStrategy(
	strategy: IAcceptedStrategies,
	version: string = 'v1'
): {
	sign: string;
} {
	const { GIT_REMOTE_SIGN_URL } = process.env;

	const baseUrl =
		!isNil(GIT_REMOTE_SIGN_URL) && !isEmpty(GIT_REMOTE_SIGN_URL)
			? GIT_REMOTE_SIGN_URL
			: 'http://127.0.0.1:3000';

	return { sign: `${baseUrl}/${version}/${strategy}/sign` };
}
