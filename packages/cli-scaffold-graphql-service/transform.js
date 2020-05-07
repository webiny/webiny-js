module.exports = function({ types: t, template: tpl }, { template, resourceName, serviceName }) {
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
                            tpl.expression(template, { placeholderPattern: false })()
                        )
                    );
                }

                if (
                    path.node.name === "apolloGatewayServices" &&
                    path.parent.type === "VariableDeclarator"
                ) {
                    path.parent.init.properties = path.parent.init.properties.filter(
                        item => item.key.name !== serviceName
                    );

                    path.parent.init.properties.push(
                        t.objectProperty(
                            t.identifier(serviceName),
                            t.stringLiteral("${" + resourceName + ".name}")
                        )
                    );
                }
            }
        }
    };
};
