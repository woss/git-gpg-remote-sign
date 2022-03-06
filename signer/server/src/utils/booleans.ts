// import { SupportedHosts } from './git.tss';

// export function buildRepoURL({
// 	host,
// 	username,
// 	repo
// }: {
// 	host: SupportedHosts;
// 	username: string;
// 	repo: string;
// }) {
// 	return `https://${host}/${username}/${repo}`;
// }

export interface IResultWithPerformance {
	performance: {
		execInSec: number;
	};
}

/**
 * checks against the common value options for the true boolean value
 * @param value Can be `'true' | '1' | 1`
 * @returns Boolean
 */
export function isTrue(value: string | number): boolean {
	return value === 'true' || value === '1' || value === 1 ? true : false;
}
/**
 * checks against the common value options for the false boolean value
 * @param value Can be `'false' | '0' | 0`
 * @returns Boolean
 */
export function isFalse(value: string | number): boolean {
	return value === 'false' || value === '0' || value === 0 ? false : true;
}
