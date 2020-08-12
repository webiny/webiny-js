module.exports = function({ types: t, template: tpl }, { resourceTemplate, resourceName }) {
    return {
        visitor: {
            Identifier(path) {
                if (path.node.name === "resources") {
                    path.parent.value.properties = path.parent.value.properties.filter(
                        val => val.key.name !== resourceName
                    );

                    path.parent.value.properties.push(
                        t.objectProperty(
                            t.identifier(resourceName),
                            tpl.expression(resourceTemplate, { placeholderPattern: false })()
                        )
                    );
                }

                if (
                    path.node.name === "endpoints" &&
                    path.parentPath &&
                    path.parentPath.parentPath &&
                    path.parentPath.parentPath.parentPath.node.key.name === "inputs"
                ) {
                    const pathValues = [`"/${resourceName}/{key+}"`, `"/${resourceName}"`];
                    const newNodes = pathValues.map(pathValue =>
                        t.objectExpression([
                            t.objectProperty(
                                t.identifier("path"),
                                tpl.expression(pathValue, { placeholderPattern: false })()
                            ),
                            t.objectProperty(
                                t.identifier("method"),
                                tpl.expression(`"ANY"`, { placeholderPattern: false })()
                            ),
                            t.objectProperty(
                                t.identifier("function"),
                                tpl.expression(`"$\{${resourceName}}"`, {
                                    placeholderPattern: false
                                })()
                            )
                        ])
                    );
                    path.parent.value.elements.push(...newNodes);
                }
            }
        }
    };
};
