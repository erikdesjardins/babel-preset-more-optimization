// Remove calls to Object.freeze, Object.seal, Object.preventExtensions

module.exports = function storeToLoadPlugin({ types: t }) {
	return {
		visitor: {
			CallExpression: function(path) {
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
