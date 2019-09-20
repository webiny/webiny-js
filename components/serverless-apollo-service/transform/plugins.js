module.exports = function({ types, template }, { plugins }) {
    const importPlugin = template(`import PLUGIN_NAME from "PLUGIN_PATH";`);

    return {
        visitor: {
            Program(path) {
                plugins.forEach(pl => {
                    const newImport = importPlugin({
                        PLUGIN_NAME: pl.name,
                        PLUGIN_PATH: pl.path
                    });
                    const lastImport = path
                        .get("body")
                        .filter(p => p.isImportDeclaration())
                        .pop();

                    if (lastImport) {
                        lastImport.insertAfter(newImport);
                    }
                });
            },
            NewExpression({ node }) {
                if (node.callee.name === "PluginsContainer") {
                    plugins.forEach(pl => {
                        node.arguments[0].elements.push(types.Identifier(pl.name));
                    });
                }
            }
        }
    };
};
