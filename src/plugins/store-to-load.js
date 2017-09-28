// Store-to-load forwarding, i.e. copy propagation
// Only constant->constant copies are propagated,
// as tracking mutation would require more complex dataflow analysis.

module.exports = function storeToLoadPlugin({ types: t }) {
	return {
		visitor: {
			VariableDeclarator: function(path) {
				if (!t.isIdentifier(path.node.id)) return; // not a pure store (destructuring)
				if (!t.isIdentifier(path.node.init)) return; // not a pure load

				const storeBinding = path.scope.getBinding(path.node.id.name);
				if (!storeBinding.constant) return; // store is overwritten

				const loadBinding = path.scope.getBinding(path.node.init.name);
				if (!loadBinding.constant) return; // value loaded is overwritten

				let renameTo = path.node.init.name;

				// both references of the redundant identifier and the original (forwarded) identifier
				// must be checked, to ensure that we won't be renaming existing references to a shadowed name
				const relevantReferences = [].concat(storeBinding.referencePaths, loadBinding.referencePaths);

				// ensure that binding will be unique in all relevant child scopes
				for (let i = 0; i < relevantReferences.length; ++i) {
					const binding = relevantReferences[i].scope.getBinding(renameTo);
					// if binding binding resolves to something, try a different identifier
					// unless it's the original (forwarded) identifier, which is fine
					if (binding && binding !== loadBinding) {
						renameTo = path.scope.generateUid(path.node.init.name);

						// replace original definition
						loadBinding.path.node.id.name = renameTo;

						// restart iteration
						i = -1;
					}
				}

				// replace references
				for (const reference of relevantReferences) {
					reference.node.name = renameTo;
				}

				// remove forwarded-out variable and repair scope information
				path.remove();
				path.scope.crawl(); // record the removal of that variable

				// repair top-level scope information
				loadBinding.scope.crawl(); // record new references of original (forwarded) variable
			}
		}
	};
};
