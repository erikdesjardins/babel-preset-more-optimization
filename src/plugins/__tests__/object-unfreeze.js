jest.autoMockOff();

const thePlugin = require('../../../utils/test-transform')(require('../object-unfreeze'));

describe('object-unfreeze', () => {
	describe('succeeds on', () => {
		thePlugin('basic', `
			Object.freeze({});
			Object.seal({});
			Object.preventExtensions({});
		`, `
			({});
			({});
			({});
		`);
		thePlugin('other cases', `
			({ 
				foo: Object.freeze({})
			});
			foo(Object.seal({}));
			var abc = Object.preventExtensions({});
		`, `
			({
				foo: {}
			});
			foo({});
			var abc = {};
		`);
	});

	describe('bails out on', () => {
		thePlugin('shadowed Object', `
			var Object = {};
			Object.freeze({});
		`);
		thePlugin('shadowed Object, child scope', `
			var Object = {};
			function foo() {
				Object.freeze({});
			}
		`);
		thePlugin('non-calls', `
			Object.freeze;
			foo(Object.freeze);
			Object.freeze.foo();
		`);
		thePlugin('different member functions', `
			Object.defineProperty({});
		`);
		thePlugin('computed member functions', `
			Object[foo]({});
		`);
		thePlugin('not a single argument', `
			Object.freeze();
			Object.freeze({}, 42);
		`);
	});
});
