jest.autoMockOff();

const thePreset = require('../../../utils/test-transform')([], { presets: [require('../index')] });

describe('more-optimization', () => {
	thePreset('cuts through exports objects', `
		function foo() {}
		function bar() {}

		const exports = Object.freeze({
			a: foo,
			b: { c: bar }
		});

		const f_ = exports.a;
		const b_ = exports.b.c;

		function main() {
			f_();
			b_();
		}
	`, `
		function foo() {}
		function bar() {}

		function main() {
			foo();
			bar();
		}
	`);
});
