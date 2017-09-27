const flattenIifePlugin = require('./plugins/flatten-iife');
const inlineIdentityPlugin = require('./plugins/inline-identity');
const objectUnfreezePlugin = require('./plugins/object-unfreeze');
const scalarReplacementPlugin = require('./plugins/scalar-replacement');
const storeToLoadPlugin = require('./plugins/store-to-load');

module.exports = function babelPresetMoreOptimization(context, opts_) {
	const opts = opts_ || {};

	const pluginOpts = {
		unsafe: opts.unsafe || false,
		debug: opts.debug || false
	};

	return {
		plugins: [
			[flattenIifePlugin, pluginOpts],
			[inlineIdentityPlugin, pluginOpts],
			[objectUnfreezePlugin, pluginOpts],
			[scalarReplacementPlugin, pluginOpts],
			[storeToLoadPlugin, pluginOpts]
		]
	};
};
