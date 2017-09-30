jest.autoMockOff();

const thePlugin = require('../../../utils/test-transform')(require('../flatten-iife'));

describe('flatten-iife', () => {
	describe('succeeds on', () => {
		thePlugin('functions', `
			(function () {
				foo();
			})();
		`, `
			foo();
		`);
		thePlugin('arrows', `
			(() => {
				foo();
			})();
		`, `
			foo();
		`);
		thePlugin('expression-body arrows', `
			(() => foo())();
		`, `
			foo();
		`);
		thePlugin('functions, no body', `
			(function () {})();
		`, ``);
		thePlugin('arrows, no body', `
			(() => {})();
		`, ``);
		thePlugin('multiple statements', `
			(function () {
				foo();
				bar();
			})();
		`, `
			foo();
			bar();
		`);
		thePlugin('return, not in statement position', `
			(function () {
				foo();
				return bar();
			})();
		`, `
			foo();
			bar();
		`);
		thePlugin('functions, in expression position', `
			var x = (function () {
				return bar();
			})();
		`, `
			var x = bar();
		`);
		thePlugin('arrows, in expression position', `
			var x = (() => {
				return bar();
			})();
		`, `
			var x = bar();
		`);
		thePlugin('expression-body arrows, in expression position', `
			var x = (() => foo())();
		`, `
			var x = foo();
		`);
		thePlugin('functions, in expression position, multiple statements', `
			var x = (function () {
				foo();
				return bar();
			})();
		`, `
			var x = (foo(), bar());
		`);
		thePlugin('arrows, in expression position, multiple statements', `
			var x = (() => {
				foo();
				return bar();
			})();
		`, `
			var x = (foo(), bar());
		`);
		thePlugin('functions, in expression position, no return', `
			var x = (function () {
				foo();
				bar();
			})();
		`, `
			var x = (foo(), bar(), void 0);
		`);
		thePlugin('arrows, in expression position, no return', `
			var x = (() => {
				foo();
				bar();
			})();
		`, `
			var x = (foo(), bar(), void 0);
		`);
		thePlugin('functions, in expression position, no body', `
			var x = (function () {})();
		`, `
			var x = void 0;
		`);
		thePlugin('arrows, in expression position, no body', `
			var x = (() => {})();
		`, `
			var x = void 0;
		`);
		thePlugin('multiple returns, not in statement position', `
			(function () {
				x();
				return foo();
				y();
				return bar();
			})();
		`, `
			x();
			foo();
		`);
		thePlugin('multiple returns, in statement position', `
			var z = (function () {
				x();
				return foo();
				y();
				return bar();
			})();
		`, `
			var z = (x(), foo());
		`);
	});

	describe('bails out on', () => {
		thePlugin('ordinary functions', `
			function foo() {}
			var x = () => y;
			foo();
			x();
			(function () {});
			() => {};
		`);
		thePlugin('params', `
			(function (x) {})();
		`);
		thePlugin('arguments', `
			(function () {})(1);
		`);
		thePlugin('var bindings', `
			(function () {
				var x;
			})();
		`);
		thePlugin('function bindings', `
			(function () {
				function foo() {}
			})();
		`);
		thePlugin('function bindings after return', `
			(function () {
				return 1;
				function foo() {}
			})();
		`);
		thePlugin('class bindings', `
			(function () {
				class Foo {}
			})();
		`);
		thePlugin('block scopes', `
			(function () {
				{};
			})();
		`);
		thePlugin('non-expression statements', `
			(function () {
				if (true) {}
			})();
		`);
		thePlugin('throw', `
			(function () {
				throw 1;
			})();
		`);
		thePlugin('this', `
			(function () {
				this;
			})();
		`);
		thePlugin('this, inner', `
			(function () {
				console.log(this);
			})();
		`);
		thePlugin('arguments', `
			(function () {
				arguments;
			})();
		`);
		thePlugin('arguments, inner', `
			(function () {
				console.log(arguments);
			})();
		`);
		thePlugin('async functions', `
			(async function () {})();
		`);
		thePlugin('async arrows', `
			(async () => {})();
		`);
		thePlugin('generators', `
			(function* () {})();
		`);
	});
});
