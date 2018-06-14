module.exports = function() {
    return {
        visitor: {
            ImportSpecifier(path) {
                if (path.node.imported.name === "Component") {
                    path.node.imported.name = "inject";
                }
            },
            Decorator(dec) {
                if (dec.node.expression.callee.name === "Component") {
                    dec.node.expression.callee.name = "inject";
                }
            }
        }
    };
};
