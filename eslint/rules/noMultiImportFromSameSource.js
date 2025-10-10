export default {
	meta: {
		type: "suggestion",
		docs: {
			description: "Enforce one import per line and preserve type imports with aliases.",
			recommended: false
		},
		fixable: "code",
		schema: []
	},
	
	create(context) {
		const parserServices = context.parserServices;
		const checker = parserServices?.program?.getTypeChecker?.() || null;
		
		function isTypeOnlyImport(node, specifier) {
			if (!checker || !parserServices?.esTreeNodeToTSNodeMap) {
				return false;
			}
			
			try {
				const tsNode = parserServices.esTreeNodeToTSNodeMap.get(specifier);
				const symbol = checker.getSymbolAtLocation(tsNode.name);
				if (!symbol) {
					return false;
				}
				
				const declarations = symbol.getDeclarations() || [];
				return declarations.every(d => {
					const kind = d.kind;
					return (
						kind === 263 || // InterfaceDeclaration
						kind === 264 || // TypeAliasDeclaration
						kind === 261 || // EnumDeclaration
						kind === 259 || // ClassDeclaration (type only)
						kind === 236 // ImportEqualsDeclaration
					);
				});
			} catch {
				return false;
			}
		}
		
		return {
			ImportDeclaration(node) {
				if (node.specifiers.length <= 1) {
					return;
				}
				
				const namedSpecifiers = node.specifiers.filter(s => s.type === "ImportSpecifier");
				if (namedSpecifiers.length <= 1) {
					return;
				}
				
				context.report({
					node,
					message: `Import only one specifier per line from "${node.source.value}".`,
					fix(fixer) {
						const source = node.source.raw;
						
						const typeImports: typeof namedSpecifiers = [];
						const valueImports: typeof namedSpecifiers = [];
						
						for (const s of namedSpecifiers) {
							if (isTypeOnlyImport(node, s)) {
								typeImports.push(s);
							} else {
								valueImports.push(s);
							}
						}
						
						const mkImport = (specifiers, isType: boolean) =>
							specifiers
								.map(s => {
									const alias = s.local.name !== s.imported.name ? ` as ${s.local.name}` : "";
									return `import ${isType ? "type " : ""}{ ${s.imported.name}${alias} } from ${source};`;
								})
								.join("\n");
						
						// handle default and namespace imports
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
							(valueImports.length ? mkImport(valueImports, false) + "\n" : "") +
							(typeImports.length ? mkImport(typeImports, true) : "");
						
						return fixer.replaceText(node, fixed.trim());
					}
				});
			}
		};
	}
};
