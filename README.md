# babel-preset-more-optimization

Babel preset for additional optimization/minification.

## If you stumble across this: NOT FOR PRODUCTION USE

## Installation

`npm install --save-dev babel-preset-more-optimization`

## Usage

**.babelrc:**

```json
{
  "presets": [
    "more-optimization"
  ]
}
```

Or, with the `unsafe` option:

```json
{
  "presets": [
    ["more-optimization", { "unsafe": true }]
  ]
}
```

...its behaviour is described in the following sections.

## Optimizations

### Flatten trivial IIFEs

In:

```js
(() => {
	foo();
	bar.baz();
})();

var x = (function() {
	return 'x';
})();

(function() {
	var someBinding;
	if (or_someNontrivialControlFlow) bailout();
})();
```

Out:

```js
foo();
bar.baz();

var x = 'x';

(function() {
	var someBinding;
	if (or_someNontrivialControlFlow) bailout();
})();
``` 

### Eliminate calls of identity functions

In:

```js
function id(x) { return x; }

var foo = id(baz(), 1, '2');

var bar = id(baz(), someOtherImpureArgument());
```

Out:

```js
function id(x) { return x; }

var foo = baz();

var bar = id(baz(), someOtherImpureArgument());
```

#### `unsafe` option

With `unsafe`, calls of identity functions whose arguments are impure due to unreferenced identifiers are eliminated.
This is unlikely to be unsafe in practice, as you'd have to be relying on side-effects of a global getter or a thrown `ReferenceError`.

In:

```js
function toClass(val, class_) { return val; }

var x = toClass(a, HTMLAnchorElement);
```

Out:

```js
function toClass(val, class_) { return val; }

var x = a;
```

### Eliminate calls of `Object.freeze` and friends

This is intended primarily to facilitate SROA (below).

In:

```js
var x = Object.freeze({ a: 5 });
```

Out:

```js
var x = { a: 5 };
```

### Scalar replacement of aggregates

In:

```js
var x = {
	a: { b: 5 },
	c() {}
};
```

Out:

```js
var _x$a$b = 5,
	_x$c = function c() {};
```

#### `unsafe` option

With `unsafe`, scalar replacement will be performed on objects whose properties are written to.
This is unlikely to be unsafe in practice, as the assigned property (alone) would have to reference `this`.
(This optimization always bails out if _existing_ object properties reference `this`.)

In:

```js
var x = {
	a: { b: 5 },
	c() {}
};

x.a.b *= 2;
```

Out:

```js
var _x$a$b = 5,
	_x$c = function c() {};

_x$a$b *= 2;
```

### Store-to-load forwarding / copy propagation

In:

```js
var a = () => {};
var _a = a;
function foo() {
	var b = _a;
	function bar() {
		var c = b;
		c();
	}
}
```

Out:

```js
var a = () => {};
function foo() {
	function bar() {
		a();
	}
}
```
