/**
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

import { log } from './config';
import { executeStrategy } from './strategies/gpg';
import { checkSupportedNodejsVersion, parseArguments } from './utils';

/**
 * Main invoke function for the Remote signer CLI
 * @public
 */
async function main(): Promise<void> {
	log.trace('Request started');

	try {
		await checkSupportedNodejsVersion();
		const { executionMode, path, strategy } = await parseArguments();
		switch (strategy) {
			case 'gpg':
				await executeStrategy(executionMode, path);
				break;

			default:
				throw new Error(`Strategy ${strategy} is not supported`);
		}
	} catch (error) {
		if (process.env.IS_DEV === '1' || process.env.IS_DEV === 'true') {
			console.log(error);
		}
		// we need to swallow the errors since the git doesn't like to see them
		log.error(error);
	}
}

main();
