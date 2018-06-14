module.exports = function(babel) {
    const { types: t } = babel;

    return {
        visitor: {
            Program(path) {
                path.traverse({
                    ImportSpecifier({ node }) {
                        if (node.imported.name === "FormComponent") {
                            node.imported.name = "withFormComponent";

                            path.traverse({
                                ClassDeclaration({ node: classNode }) {
                                    if (!classNode.decorators) {
                                        classNode.decorators = [];
                                    }

                                    classNode.decorators.unshift(
                                        t.Decorator(
                                            t.CallExpression(t.Identifier("withFormComponent"), [])
                                        )
                                    );
                                }
                            });
                        }
                    }
                });
            }
        }
    };
};
