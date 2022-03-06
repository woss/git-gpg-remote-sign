import { isTrue } from './booleans';

describe('Test booleans.ts', () => {
	it('should test the isTrue ', () => {
		expect(isTrue('true')).toBe(true);
		expect(isTrue('1')).toBe(true);
		expect(isTrue(1)).toBe(true);
	});
});
