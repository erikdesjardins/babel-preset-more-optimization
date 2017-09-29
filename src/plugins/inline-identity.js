// Inline trivial identity functions

module.exports = function scalarReplacementPlugin({ types: t }) {
	return {
		visitor: {
			CallExpression: function(path) {
				const { unsafe } = this.opts;

				const { callee } = path.node;

				if (!t.isIdentifier(callee)) return; // IIFE or something

				// check for impure arguments, except the first (forwarded) argument, which is fine
				for (const arg of path.get('arguments').slice(1)) {
					if (!arg.isPure()) {
						if (unsafe && t.isIdentifier(arg)) continue; // unreferenced identifiers which could throw
						return; // impure additional arguments
					}
				}

				// check if callee is a function
				const binding = path.scope.getBinding(callee.name);
				if (!binding || !binding.constant) return;
				let fn;
				if (t.isFunctionDeclaration(binding.path.node)) {
					fn = binding.path.node;
				} else if (t.isVariableDeclarator(binding.path.node)) {

					if (!t.isFunction(binding.path.node.init)) return; // something weird
					fn = binding.path.node.init;
				} else {
					return; // class or something
				}

				// check if function is an identity function
				if (t.isIdentifier(fn.body)) {
					// expression-body arrow function
					if (fn.params.length === 0 ||
						fn.params[0].name !== fn.body.name) return; // returns a different identifier
				} else if (t.isBlock(fn.body)) {
					if (fn.body.body.length === 0 ||
						!t.isReturnStatement(fn.body.body[0]) ||
						!t.isIdentifier(fn.body.body[0].argument) ||
						fn.params.length === 0 ||
						fn.params[0].name !== fn.body.body[0].argument.name) return; // doesn't return the first argument
				} else {
					return; // something weird, probably unreachable
				}

				// replace with first argument or void expression
				path.replaceWith(path.get('arguments')[0] || t.unaryExpression('void', t.numericLiteral(0)));
			}
		}
	};
};
