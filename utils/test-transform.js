// https://github.com/babel/minify
// MIT License

const babel = require("babel-core");

const unpad = require("./unpad");

function transform(source, options) {
	return babel.transform(unpad(source), options).code.trim();
}

function makeTester(plugins, opts, check) {
	if (!Array.isArray(plugins)) {
		plugins = [plugins];
	}
	const thePlugin = (name, source, expected = source) => {
		const { stack } = new Error();
		const options = Object.assign(
			{ plugins, sourceType: "script" },
			opts,
		);
		it(name, () => {
			const transformed = transform(source, options);
			try {
				check({
					transformed,
					expected: unpad(expected),
					source: unpad(source)
				});
			} catch (e) {
				// use the stack from outside the it() clause
				// (the one inside the clause doesn’t show the actual test code)
				e.stack = stack;
				throw e;
			}
		});
	};
	thePlugin.skip = name => it.skip(name);
	return thePlugin;
}

module.exports = (plugins, opts) =>
	makeTester(plugins, opts, ({ transformed, expected }) => {
		expect(transformed).toBe(expected);
	});

module.exports.withVerifier = (plugins) =>
	(name, verifierVisitor, ...args) => makeTester(plugins, {
		passPerPreset: true,
		presets: [{ plugins: [() => ({ visitor: { Program: { exit: verifierVisitor } } })] }],
	}, ({ transformed, expected }) => {
		expect(transformed).toBe(expected);
	})(name, ...args);

module.exports.snapshot = (plugins, opts) =>
	makeTester(plugins, opts, ({ transformed, source }) => {
		// Jest arranges in alphabetical order, So keeping it as _source
		expect({ _source: source, expected: transformed }).toMatchSnapshot();
	});
