module.exports = function() {
    return {
        visitor: {
            Program(path) {
                path.traverse({
                    Decorator(dec) {
                        if (dec.node.expression.callee.name === "Component") {
                            let hasImport = false;
                            path.traverse({
                                ImportSpecifier({ node }) {
                                    if (node.imported.name === "Component") {
                                        hasImport = true;
                                    }
                                }
                            });

                            if (!hasImport) {
                                dec.remove();
                            }
                        }
                    }
                });
            }
        }
    };
};
