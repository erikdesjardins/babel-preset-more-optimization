jest.autoMockOff();

const thePlugin = require('../../../utils/test-transform')(require('../inline-identity'));
const theUnsafePlugin = require('../../../utils/test-transform')([[require('../inline-identity'), { unsafe: true }]]);

describe('inline-identity', () => {
	describe('succeeds on', () => {
		thePlugin('function declaration', `
			function i(x) {
				return x;
			}
			var x = i(1);
		`, `
			function i(x) {
				return x;
			}
			var x = 1;
		`);
		thePlugin('function expression', `
			var i = function (x) {
				return x;
			};
			var x = i(1);
		`, `
			var i = function (x) {
				return x;
			};
			var x = 1;
		`);
		thePlugin('arrow function expression, expression body', `
			var i = x => x; 
			var x = i(1);
		`, `
			var i = x => x;
			var x = 1;
		`);
		thePlugin('arrow function expression, block body', `
			var i = x => {
				return x;
			}; 
			var x = i(1);
		`, `
			var i = x => {
				return x;
			};
			var x = 1;
		`);
		thePlugin('additional pure arguments', `
			function i(x) {
				return x;
			}
			var x = i(1, i, 42);
		`, `
			function i(x) {
				return x;
			}
			var x = 1;
		`);
		thePlugin('impure first argument', `
			function i(x) {
				return x;
			}
			var x = i(foo());
		`, `
			function i(x) {
				return x;
			}
			var x = foo();
		`);
		thePlugin('no first argument', `
			function i(x) {
				return x;
			}
			var x = i();
		`, `
			function i(x) {
				return x;
			}
			var x = void 0;
		`);
		thePlugin('dead code after return', `
			function i(x) {
				return x;
				console.log();
			}
			var x = i(1);
		`, `
			function i(x) {
				return x;
				console.log();
			}
			var x = 1;
		`);

		describe('with unsafe', () => {
			theUnsafePlugin('additional sort-of-pure arguments', `
				function i(x) {
					return x;
				}
				var x = i(1, unreferencedGlobal);
			`, `
				function i(x) {
					return x;
				}
				var x = 1;
			`);
		});
	});

	describe('bails out on', () => {
		thePlugin('impure arguments', `
			function i(x) {
				return x;
			}
			var x = i(1, foo());
		`);
		thePlugin('mutation of function declaration', `
			function i(x) {
				return x;
			}
			var x = i(1);
			i = 5;
		`);
		thePlugin('mutation of variable', `
			var i = function (x) {
				return x;
			};
			var x = i(1);
			i = 5;
		`);
		thePlugin('variables not holding a function', `
			var i = 5;
			var x = i(1);
		`);
		thePlugin('classes', `
			class i {};
			var x = i(1);
		`);
		thePlugin('unknown functions', `
			var x = i(1);
		`);
		thePlugin('property access', `
			function i(x) {
				return x;
			}
			var x = a.i(1);
		`);
		thePlugin('not a pure function', `
			function i(x) {
				console.log(1);
				return x;
			}
			var x = a.i(1);
		`);
		thePlugin('not a pure function 2', `
			function i(x) {
				foo;
				return x;
			}
			var x = a.i(1);
		`);
		thePlugin('conditional return', `
			function i(x) {
				if (true) return x;
			}
			var x = a.i(1);
		`);
		thePlugin('arrow functions returning a different identifier', `
			var i = x => y;
			var ii = () => y;
			i(1);
			ii(2);
		`);
		thePlugin('returning an expression', `
			var i = x => ({ x });
			var ii = function (x) {
				return { x };
			};
			i(1);
			ii(2);
		`);
		thePlugin('additional sort-of-pure arguments', `
			function i(x) {
				return x;
			}
			var x = i(1, unreferencedGlobal);
		`);

		describe('with unsafe', () => {
			theUnsafePlugin('impure arguments after sort-of-pure arguments', `
				function i(x) {
					return x;
				}
				var x = i(1, unreferencedGlobal, actuallyUnsafe());
			`);
		});
	});
});
