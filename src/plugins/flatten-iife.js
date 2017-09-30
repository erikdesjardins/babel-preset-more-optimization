// Flatten trivial IIFEs

module.exports = function scalarReplacementPlugin({ types: t }) {
	return {
		visitor: {
			CallExpression(path) {
				const { callee, arguments: _arguments } = path.node;

				if (_arguments.length > 0) return; // arguments

				if (!t.isFunction(callee)) return; // not a function
				if (callee.async || callee.generator) return; // async or generator
				if (Object.keys(path.get('callee').scope.bindings).length > 0) return; // bindings

				// ensure that `this` and `arguments` are not referenced from within the IIFE
				let badReference = false;
				path.get('callee').traverse({
					ThisExpression(innerPath) {
						badReference = true;
						innerPath.stop();
					},
					Identifier(innerPath) {
						if (innerPath.node.name === 'arguments') {
							badReference = true;
							innerPath.stop();
						}
					}
				});
				if (badReference) return;

				// select statements up to the first return
				let statements = [];
				let foundReturnStatement = false;
				for (const statement of (t.isBlockStatement(callee.body) ? callee.body.body : [t.returnStatement(callee.body)])) {
					if (t.isExpressionStatement(statement)) {
						statements.push(statement);
					} else if (t.isReturnStatement(statement)) {
						foundReturnStatement = true;
						statements.push(t.expressionStatement(statement.argument));
						break; // everything after is dead code
					} else {
						return; // not an expression statement or a return
					}
				}

				// replace IIFE
				if (t.isExpressionStatement(path.parent)) {
					// expression statement; we can emit inner statements as-is
					path.parentPath.replaceWithMultiple(statements);
				} else {
					// expression context; we must emit inner statements as a sequence expression
					if (!foundReturnStatement) {
						// add implicit return
						statements.push(t.expressionStatement(t.unaryExpression('void', t.numericLiteral(0))));
					}

					// pull values out of each expression statement
					const innerStatements = statements.map(statement => statement.expression);

					path.replaceWith(innerStatements.length === 1 ? innerStatements[0] : t.sequenceExpression(innerStatements));
				}
			}
		}
	};
};
