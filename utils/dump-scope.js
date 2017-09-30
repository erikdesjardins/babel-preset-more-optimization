// modified from scope.dump()
// https://github.com/babel/babel/blob/6560a29c36fd0f9ef84e78738de11e0477b1384f/packages/babel-traverse/src/scope/index.js#L385
module.exports = function dumpScope(scope) {
	const rows = [];
	do {
		rows.push(scope.block.type);
		for (const name in scope.bindings) {
			const binding = scope.bindings[name];
			rows.push(`- ${name} ${JSON.stringify({
				constant: binding.constant,
				references: binding.references,
				violations: binding.constantViolations.length,
				kind: binding.kind,
			})}`);
		}
	} while ((scope = scope.parent));
	return rows.join('\n');
};
