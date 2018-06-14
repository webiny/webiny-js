module.exports = function(babel) {
    const { types: t } = babel;

    let decoratorOptions = null;

    return {
        visitor: {
            ImportSpecifier(path) {
                if (path.node.imported.name !== "createComponent") {
                    return;
                }
                path.node.imported.name = "Component";
            },
            ExportDefaultDeclaration(path) {
                // Try finding class declaration
                const classDec = path.container.filter(p => p.type === "ClassDeclaration")[0];
                if (!classDec) {
                    return;
                }

                if (!classDec.decorators) {
                    classDec.decorators = [];
                }

                if (path.node.declaration.type === "CallExpression") {
                    decoratorOptions = path.node.declaration.arguments[1] || null;
                    path.node.declaration = t.identifier(classDec.id.name);
                }

                const args = decoratorOptions ? [decoratorOptions] : [];

                classDec.decorators.push(
                    t.Decorator(t.CallExpression(t.Identifier("Component"), args))
                );
            }
        }
    };
};
