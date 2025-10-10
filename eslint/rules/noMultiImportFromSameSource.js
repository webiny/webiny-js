export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "Enforce one import specifier per line (does not auto-separate type imports).",
			recommended: false
		},
		fixable: "code",
		schema: []
	},
	
	create(context) {
		return {
			ImportDeclaration(node) {
				// skip single specifier imports
				if (node.specifiers.length <= 1) return;
				
				const named = node.specifiers.filter(s => s.type === "ImportSpecifier");
				if (named.length <= 1) return;
				
				context.report({
					node,
					message: `Import only one specifier per line from "${node.source.value}".`,
					fix(fixer) {
						const source = node.source.raw;
						
						// recreate each named import on its own line
						const mkImport = specifier =>
							`import { ${specifier.imported.name} } from ${source};`;
						
						// handle default and namespace imports first
						const defaultAndNamespace = node.specifiers.filter(
							s => s.type !== "ImportSpecifier"
						);
						
						const prefix = defaultAndNamespace.length
							? `import ${defaultAndNamespace
								.map(s => {
									if (s.type === "ImportDefaultSpecifier") return s.local.name;
									if (s.type === "ImportNamespaceSpecifier") return `* as ${s.local.name}`;
									return "";
								})
								.filter(Boolean)
								.join(", ")} from ${source};\n`
							: "";
						
						const fixed =
							prefix +
							named.map(s => mkImport(s)).join("\n");
						
						return fixer.replaceText(node, fixed.trim());
					}
				});
			}
		};
	}
};
