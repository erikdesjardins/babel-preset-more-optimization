// Store-to-load forwarding

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

				// ensure that binding will be unique in all relevant child scopes
				for (let i = 0; i < storeBinding.referencePaths.length; ++i) {
					const binding = storeBinding.referencePaths[i].scope.getBinding(renameTo);
					if (binding && binding !== loadBinding) {
						// binding resolves to something, try a different identifier
						renameTo = path.scope.generateUid(path.node.init.name);

						// replace original definition
						loadBinding.path.node.id.name = renameTo;

						// restart iteration
						i = -1;
					}
				}

				// replace references
				path.scope.rename(path.node.id.name, renameTo);

				// remove forwarded-out variable
				path.remove();
			}
		}
	};
};
