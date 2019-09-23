module.exports = function({ types, template }, { plugins }) {
    const importPlugin = template(`import PLUGIN_NAME from "PLUGIN_PATH";`);
    const { identifier, callExpression } = types;

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
                        let plDef = identifier(pl.name);
                        if (pl.options) {
                            plDef = callExpression(plDef, [template.expression(JSON.stringify(pl.options))()]);
                        }
                        node.arguments[0].elements.push(plDef);
                    });
                }
            }
        }
    };
};
