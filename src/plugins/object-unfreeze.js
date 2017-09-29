// Remove calls to Object.freeze, Object.seal, Object.preventExtensions
// ...with the aim of facilitating SROA (primarily), DCE, and inlining.
// Currently, these functions also hurt performance, by converting the objects to a slower backing store (in V8),
// however in the future this may change (V8 will optimize for nonconfigurable nonwriteable properties in context specialization),
// so it may be beneficial to remove this and just make SROA "see through" these functions.

module.exports = function storeToLoadPlugin({ types: t }) {
	return {
		visitor: {
			CallExpression(path) {
				// limit to `Object.{freeze,seal,preventExtensions}(<single argument>)`
				if (!t.isMemberExpression(path.node.callee)) return;
				if (!t.isIdentifier(path.node.callee.object, { name: 'Object' })) return;
				if (!t.isIdentifier(path.node.callee.property)) return;
				if (['freeze', 'seal', 'preventExtensions'].indexOf(path.node.callee.property.name) === -1) return;
				if (path.node.arguments.length !== 1) return;

				// ensure that Object is not shadowed
				if (path.scope.getBinding('Object')) return;

				path.replaceWith(path.node.arguments[0]);
			}
		}
	};
};
