// Scalar replacement of aggregates

function convertToIdentifier(string) {
	return string.replace(/[^\w_$]/g, '_');
}

module.exports = function scalarReplacementPlugin({ types: t }) {
	return {
		visitor: {
			VariableDeclarator: function(path) {
				const { unsafe } = this.opts;

				if (!t.isIdentifier(path.node.id)) return; // not a pure store (destructuring)
				if (!t.isObjectExpression(path.node.init)) return; // only immediate object literals can be SROA'd

				const binding = path.scope.getBinding(path.node.id.name);
				if (!binding.constant) return; // variable is mutated, bail out

				// ensure that `this` is not referenced from within the object,
				// as this could allow it to escape
				let referencedThis = false;
				path.get('init').traverse({
					ThisExpression(innerPath) {
						referencedThis = true;
						innerPath.stop();
					}
				});
				if (referencedThis) return;

				// populate the map with initial values of each object property
				const properties = Object.create(null); // raw key -> value
				for (const prop of path.node.init.properties) {
					let name;
					if (t.isIdentifier(prop.key)) {
						name = prop.key.name;
					} else if (t.isStringLiteral(prop.key)) {
						name = prop.key.value;
					} else {
						return; // computed property
					}

					if (name === '__proto__') return; // magic __proto__ property

					let value;
					if (t.isObjectProperty(prop)) {
						value = prop.value;
					} else if (t.isObjectMethod(prop)) {
						switch (prop.kind) {
							case 'method':
								value = t.functionExpression(null, prop.params, prop.body, prop.generator, prop.async);
								break;
							case 'get':
							case 'set':
								return; // getters and setters
						}
					} else {
						return; // unrecognised
					}

					properties[name] = value;
				}

				// populate a map of references, and verify usages are legal (non-escaping, etc.)
				const propertyReferences = Object.create(null); // raw key -> [references]
				for (const refPath of binding.referencePaths) {
					if (!t.isMemberExpression(refPath.parent)) return; // object escapes through something other than property access

					// check for mutation
					if (t.isAssignmentExpression(refPath.parentPath.parent) ||
						t.isArrayPattern(refPath.parentPath.parent) ||
						t.isObjectProperty(refPath.parentPath.parent) && t.isObjectPattern(refPath.parentPath.parentPath.parent)) {
						if (!unsafe) return; // mutation
					}

					let name;
					if (t.isIdentifier(refPath.parent.property)) {
						name = refPath.parent.property.name;
					} else if (t.isStringLiteral(refPath.parent.property)) {
						name = refPath.parent.property.value;
					} else {
						return; // computed member access
					}

					// if a property which isn't in the initial object is referenced, bail out
					if (!(name in properties)) return;

					propertyReferences[name] = (propertyReferences[name] || []).concat([refPath]);
				}

				// generate unique identifiers for each property, and emit them into the variable declaration
				const identifiers = Object.create(null); // raw key -> identifier
				for (const name in properties) {
					const val = properties[name];

					const identifier = t.identifier(path.scope.generateUid(path.node.id.name + '$' + convertToIdentifier(name)));

					// emit variable declaration into scope
					path.insertBefore(t.variableDeclarator(identifier, val));

					identifiers[name] = identifier;
				}

				// replace each property reference with the corresponding unique identifier
				for (const name in propertyReferences) {
					for (const refPath of propertyReferences[name]) {
						refPath.parentPath.replaceWith(identifiers[name]);
					}
				}

				// remove the old object and repair bindings
				path.remove();
				path.scope.crawl(); // record the removal of the object, and the references of the new variables
			}
		}
	};
};
