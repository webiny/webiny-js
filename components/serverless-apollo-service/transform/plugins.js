module.exports = function({ types, template }, { plugins }) {
    const importPlugin = template(`import PLUGIN_NAME from "PLUGIN_PATH";`);
    const {
        identifier,
        spreadElement,
        objectExpression,
        variableDeclaration,
        variableDeclarator
    } = types;

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

                plugins
                    .filter(pl => pl.options)
                    .forEach(pl => {
                        const lastImport = path
                            .get("body")
                            .filter(p => p.isImportDeclaration())
                            .pop();

                        if (lastImport) {
                            lastImport.insertAfter(
                                variableDeclaration("const", [
                                    variableDeclarator(
                                        identifier(pl.name + "Options"),
                                        template.expression(JSON.stringify(pl.options))()
                                    )
                                ])
                            );
                        }
                    });
            },
            NewExpression({ node }) {
                if (node.callee.name === "PluginsContainer") {
                    plugins.forEach(pl => {
                        let plDef = types.identifier(pl.name);
                        if (pl.options) {
                            plDef = types.callExpression(plDef, [
                                objectExpression([
                                    spreadElement(identifier("config")),
                                    spreadElement(identifier(pl.name + "Options"))
                                ])
                            ]);
                        } else {
                            plDef = types.callExpression(plDef, [types.identifier("config")]);
                        }
                        node.arguments[0].elements.push(plDef);
                    });
                }
            }
        }
    };
};
