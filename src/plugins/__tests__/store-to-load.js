jest.autoMockOff();

const thePlugin = require('../../../utils/test-transform')(require('../store-to-load'));

const declarations = `
			var something = 1;
			class Foo {}
			function foo() {}
`;

describe('store-to-load', () => {
	describe('succeeds on', () => {
		thePlugin('basic', `
			${declarations}
			var x = something;
			var y = Foo;
			var z = foo;
			function main() {
				x;
				y;
				z;
			}
		`, `
			${declarations}
			function main() {
				something;
				Foo;
				foo;
			}
		`);
		thePlugin('multiple variables per declaration', `
			${declarations}
			var a = Foo,
				b = foo;
			function main1() {
				a;
				b;
			}
		`, `
			${declarations}
			function main1() {
				Foo;
				foo;
			}
		`);
		thePlugin('not removing other variables in declaration', `
			${declarations}
			var a = Foo,
				b = 5;
			function main1() {
				a;
				b;
			}
		`, `
			${declarations}
			var b = 5;
			function main1() {
				Foo;
				b;
			}
		`);
		thePlugin('forwarding through multiple variables', `
			${declarations}
			var c = something;
			var d = c;
			function main2() {
				c;
				d;
			}
		`, `
			${declarations}
			function main2() {
				something;
				something;
			}
		`);
		thePlugin('inner function scopes', `
			${declarations}
			var e = something;
			function main3() {
				e;
				function main3inner() {
					var xy = 1;
					e;
				}
			}
		`, `
			${declarations}
			function main3() {
				something;
				function main3inner() {
					var xy = 1;
					something;
				}
			}
		`);
		thePlugin('inner block scopes', `
			${declarations}
			var e = something;
			{
				e;
			}
		`, `
			${declarations}
			{
				something;
			}
		`);
		thePlugin('through variables in multiple scopes', `
			${declarations}
			var a = something;
			function x() {
				const b = a;
				{
					let c = b;
					{
						d;
					}
				}
			}
		`, `
			${declarations}
			function x() {
				{
					{
						d;
					}
				}
			}
		`);
		thePlugin('shadowed identifiers', `
			var something = 1;
			class Foo {}
			function foo() {}

			var a = something;
			var b = Foo;
			var c = foo;
			function x() {
				var something = 5;
				var Foo = 6;
				var foo = 7;
				a;
				b;
				c;
			}
		`, `
			var _something = 1;
			class _Foo {}
			function _foo() {}

			function x() {
				var something = 5;
				var Foo = 6;
				var foo = 7;
				_something;
				_Foo;
				_foo;
			}
		`);
		thePlugin('double-shadowed identifiers', `
			var something = 1;
			class Foo {}
			function foo() {}

			var a = something;
			var b = Foo;
			var c = foo;
			function x() {
				var something = 5;
				var Foo = 6;
				var foo = 7;
				var _something = 8;
				var _Foo = 9;
				var _foo = 0;
				a;
				b;
				c;
			}
		`, `
			var _something2 = 1;
			class _Foo2 {}
			function _foo2() {}

			function x() {
				var something = 5;
				var Foo = 6;
				var foo = 7;
				var _something = 8;
				var _Foo = 9;
				var _foo = 0;
				_something2;
				_Foo2;
				_foo2;
			}
		`);
		thePlugin('triple-shadowed identifiers', `
			var something = 1;

			var a = something;
			function x() {
				var something = 5;
				var _something = 8;
				var _something2 = 11; 
				a;
			}
		`, `
			var _something3 = 1;

			function x() {
				var something = 5;
				var _something = 8;
				var _something2 = 11;
				_something3;
			}
		`);
	});

	describe('bails out on', () => {
		thePlugin('destructuring', `
			${declarations}
			var { call } = something;
			call;
		`);
		thePlugin('stored to mutated variable', `
			${declarations}
			var a = something;
			a;
			a = foo;
		`);
		thePlugin('stored value of mutated variable', `
			function something() {}
			var a = something;
			a;
			something = somethingElse;
		`);
	});
});
