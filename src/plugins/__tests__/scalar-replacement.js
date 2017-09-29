jest.autoMockOff();

const thePlugin = require('../../../utils/test-transform')(require('../scalar-replacement'));
const theUnsafePlugin = require('../../../utils/test-transform')([[require('../scalar-replacement'), { unsafe: true }]]);
const thePluginVerifies = require('../../../utils/test-transform').withVerifier(require('../scalar-replacement'));
const dumpScope = require('../../../utils/dump-scope');

describe('scalar-replacement', () => {
	describe('succeeds on', () => {
		thePlugin('basic', `
			var x = {
				a: 1,
			};
		`, `
			var _x$a = 1;
		`);
		thePlugin('nested', `
			var x = {
				a: 1,
				b: { c: 2 }
			};
		`, `
			var _x$a = 1,
			    _x$b$c = 2;
		`);
		thePlugin('replacing references', `
			var x = {
				a: 1
			};
			x.a;
		`, `
			var _x$a = 1;
			_x$a;
		`);
		thePlugin('replacing nested references', `
			var x = {
				a: 1,
				b: { c: 5 }
			};
			x.a;
			x.b.c;
		`, `
			var _x$a = 1,
			    _x$b$c = 5;
			_x$a;
			_x$b$c;
		`);
		thePlugin('preserves const and let', `
			const x = {
				a: 1,
			};
			let y = {
				b: 2,
			};
		`, `
			const _x$a = 1;
			let _y$b = 2;
		`);
		thePlugin('quoted props', `
			var x = {
				'a': 1,
				['b']: 2
			};
		`, `
			var _x$a = 1,
			    _x$b = 2;
		`);
		thePlugin('quoted member access', `
			var x = {
				a: 1,
			};
			x['a'];
		`, `
			var _x$a = 1;
			_x$a;
		`);
		thePlugin('non-identifier props', `
			var x = {
				'-': 1,
			};
			x['-'];
		`, `
			var _x$_ = 1;
			_x$_;
		`);
		thePlugin('semi-identifier props with numbers', `
			var x = {
				'9n': 1
			};
			x['9n'];
		`, `
			var _x$9n = 1;
			_x$9n;
		`);
		thePlugin('non-identifier props name collisions', `
			var x = {
				'-': 1,
				_: 2,
				'/': 3
			};
			x['-'];
			x._;
			x['/'];
		`, `
			var _x$_ = 1,
			    _x$_2 = 2,
			    _x$_3 = 3;
			_x$_;
			_x$_2;
			_x$_3;
		`);
		thePlugin('shadowed references', `
			var x = {
				a: 1
			};
			function foo() {
				var _x$a;
				x.a;
			}
		`, `
			var _x$a2 = 1;
			function foo() {
				var _x$a;
				_x$a2;
			}
		`);
		thePlugin('externally-shadowed references', `
			var x = {
				a: 1
			};
			var _x$a;
			function foo() {
				x.a;
			}
		`, `
			var _x$a2 = 1;
			var _x$a;
			function foo() {
				_x$a2;
			}
		`);
		thePlugin('double-shadowed references', `
			var x = {
				a: 1
			};
			function foo() {
				var _x$a;
				var _x$a2;
				x.a;
			}
		`, `
			var _x$a3 = 1;
			function foo() {
				var _x$a;
				var _x$a2;
				_x$a3;
			}
		`);
		thePlugin('double-externally-shadowed references', `
			var x = {
				a: 1
			};
			var _x$a;
			var _x$a2;
			function foo() {
				x.a;
			}
		`, `
			var _x$a3 = 1;
			var _x$a;
			var _x$a2;
			function foo() {
				_x$a3;
			}
		`);
		thePlugin('combination-shadowed references', `
			var x = {
				a: 1
			};
			var _x$a;
			function foo() {
				var _x$a2;
				x.a;
			}
		`, `
			var _x$a3 = 1;
			var _x$a;
			function foo() {
				var _x$a2;
				_x$a3;
			}
		`);
		thePlugin('duplicate keys', `
			var x = {
				a: 1,
				a: 2,
				['a']: 3,
			};
		`, `
			var _x$a = 3;
		`);
		thePlugin('arrow functions', `
			var x = {
				a: () => 1
			};
		`, `
			var _x$a = () => 1;
		`);
		thePlugin('methods', `
			var x = {
				a(y) {
					y;
				},
				async b(z) {
					z;
				},
				*c(w) {
					w;
				}
			};
		`, `
			var _x$a = function a(y) {
				y;
			},
			    _x$b = async function b(z) {
				z;
			},
			    _x$c = function* c(w) {
				w;
			};
		`);
		thePlugin('methods with string names', `
			var x = {
				'a'(y) {
					y;
				},
				async 'b'(z) {
					z;
				},
				*'c'(w) {
					w;
				}
			};
		`, `
			var _x$a = function a(y) {
				y;
			},
			    _x$b = async function b(z) {
				z;
			},
			    _x$c = function* c(w) {
				w;
			};
		`);
		thePlugin('methods with computed names', `
			var x = {
				['-a'](y) {
					y;
				},
				async ['9b'](z) {
					z;
				},
				*['-c'](w) {
					w;
				}
			};
		`, `
			var _x$_a = function _a(y) {
				y;
			},
			    _x$9b = async function _b(z) {
				z;
			},
			    _x$_c = function* _c(w) {
				w;
			};
		`);
		thePlugin('preserves ordering of nearby vars', `
			var x = 1,
				y = {
					a: 2,
					b: 3,
				},
				z = 4;
		`, `
			var x = 1,
			    _y$a = 2,
			    _y$b = 3,
			    z = 4;
		`);
		thePlugin('preserves ordering when nested', `
			var x = {
				a: 1, 
				b: {
					c: 3,
					d: 4,
				},
				e: 5,
			};
		`, `
			var _x$a = 1,
			    _x$b$c = 3,
			    _x$b$d = 4,
			    _x$e = 5;
		`);
		thePlugin('nearby `this`', `
			var x = this, 
				y = {
					a: 5
				},
				z = this;
			this;
		`, `
			var x = this,
			    _y$a = 5,
			    z = this;
			this;
		`);

		thePluginVerifies('correctly fixes bindings', path => {
			const fooScope = path.get('body.1').scope;
			expect(dumpScope(fooScope)).toBe([
				'FunctionDeclaration',
				'Program',
				`- _x$a ${JSON.stringify({ constant: true, references: 1, violations: 0, kind: 'var' })}`,
				`- _x$b$c ${JSON.stringify({ constant: true, references: 1, violations: 0, kind: 'var' })}`,
				`- foo ${JSON.stringify({ constant: true, references: 0, violations: 0, kind: 'hoisted' })}`,
			].join('\n'));
		}, `
			var x = {
				a: 1,
				b: { c: 5 }
			};
			function foo() {
				x.a;
				x.b.c;
			}
		`, `
			var _x$a = 1,
			    _x$b$c = 5;
			function foo() {
				_x$a;
				_x$b$c;
			}
		`);
		thePluginVerifies('doesn\'t break bindings when inserting into var sequence', path => {
			const fooScope = path.get('body.1').scope;
			expect(dumpScope(fooScope)).toBe([
				'FunctionDeclaration',
				'Program',
				`- y ${JSON.stringify({ constant: false, references: 0, violations: 1, kind: 'var' })}`,
				`- _x$a ${JSON.stringify({ constant: true, references: 1, violations: 0, kind: 'var' })}`,
				`- _x$b$c ${JSON.stringify({ constant: true, references: 1, violations: 0, kind: 'var' })}`,
				`- z ${JSON.stringify({ constant: true, references: 1, violations: 0, kind: 'var' })}`,
				`- foo ${JSON.stringify({ constant: true, references: 0, violations: 0, kind: 'hoisted' })}`,
			].join('\n'));
		}, `
			var y = 1, 
				x = {
					a: 1,
					b: { c: 5 }
				},
				z = 2;
			function foo() {
				y = 2;
				x.a;
				x.b.c;
				z;
			}
		`, `
			var y = 1,
			    _x$a = 1,
			    _x$b$c = 5,
			    z = 2;
			function foo() {
				y = 2;
				_x$a;
				_x$b$c;
				z;
			}
		`);
		thePlugin('mutation only of inner object', `
			var x = {
				a: { b: 5 }
			};
			x.a.b = 5;
		`, `
			var _x$a = { b: 5 };
			_x$a.b = 5;
		`);

		describe('with unsafe', () => {
			theUnsafePlugin('mutation, assignment', `
				var x = {
					a: 1
				};
				x.a = 2;
			`, `
				var _x$a = 1;
				_x$a = 2;
			`);
			theUnsafePlugin('mutation, exotic assignment', `
				var x = {
					a: 1
				};
				x.a += 1;
				var y = {
					a: 1
				};
				y.a |= 2;
			`, `
				var _x$a = 1;
				_x$a += 1;
				var _y$a = 1;
				_y$a |= 2;
			`);
			theUnsafePlugin('mutation, array destructuring', `
				var x = {
					a: 1
				};
				[x.a] = foo;
			`, `
				var _x$a = 1;
				[_x$a] = foo;
			`);
			theUnsafePlugin('mutation, object destructuring', `
				var x = {
					a: 1
				};
				({ y: x.a } = foo);
			`, `
				var _x$a = 1;
				({ y: _x$a } = foo);
			`);
		});
	});

	describe('bails out on', () => {
		thePlugin('mutated variable', `
			var x = {
				a: 5,
				get y() {}
			};
			x = {};
		`);
		thePlugin('object escapes', `
			var x = {
				a: 5
			};
			x;
		`);
		thePlugin('object escapes through call', `
			var x = {
				a: 5
			};
			foo(x);
		`);
		thePlugin('object escapes through assignment', `
			var x = {
				a: 5
			};
			var y = x;
		`);
		thePlugin('getters', `
			var x = {
				a: 5,
				get y() {}
			};
		`);
		thePlugin('setters', `
			var x = {
				a: 5,
				set y(v) {}
			};
		`);
		thePlugin('__proto__', `
			var x = {
				a: 5,
				__proto__: 6
			};
			var y = {
				a: 5,
				'__proto__': 6
			};
		`);
		thePlugin('unknown props', `
			var x = {
				a: 5
			};
			x.hasOwnProperty;
		`);
		thePlugin('computed props', `
			var x = {
				['x' + 'y']: 5
			};
		`);
		thePlugin('computed props through variable', `
			var x = {
				[y]: 5
			};
		`);
		thePlugin('computed member access', `
			var x = {
				ab: 5
			};
			x['a' + 'b'];
		`);
		thePlugin('object spread', `
			var x = {
				ab: 5,
				...foo
			};
		`);
		thePlugin('destructuring', `
			var { a } = {
				a: 5
			};
		`);
		thePlugin('computed member access through variable', `
			var x = {
				ab: 5
			};
			x[ab];
		`);
		thePlugin('referencing this, simple cases', `
			var x = {
				a: function () {
					this;
				}
			};
			var y = {
				a() {
					this;
				}
			};
			var z = {
				async a() {
					this;
				}
			};
			var w = {
				*a() {
					this;
				}
			};
		`);
		thePlugin('referencing this, in IIFE initializer', `
			var x = {
				x: (() => {
					return function () {
						this;
					};
				})()
			};
		`);
		thePlugin('referencing this, deep in IIFE initializer', `
			var x = {
				x: (() => {
					return function () {
						() => this;
					};
				})()
			};
		`);
		thePlugin('mutation, assignment', `
			var x = {
				a: 1
			};
			x.a = 2;
		`);
		thePlugin('mutation, exotic assignment', `
			var x = {
				a: 1
			};
			x.a += 1;
			var y = {
				a: 1
			};
			y.a |= 2;
		`);
		thePlugin('mutation, array destructuring', `
			var x = {
				a: 1
			};
			[x.a] = foo;
		`);
		thePlugin('mutation, object destructuring', `
			var x = {
				a: 1
			};
			({ y: x.a } = foo);
		`);
		thePlugin('mutation, complex destructuring', `
			var x = {
				a: 1
			};
			[{ foo: [{ y: x.a }] }] = foo;
		`);
	});
});
