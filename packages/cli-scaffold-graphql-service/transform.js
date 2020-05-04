module.exports = function({ types: t, template: tpl }, { template, resourceName }) {
    return {
        visitor: {
            Identifier(path) {
                if (path.node.name === "resources") {
                    path.parent.value.properties.push(
                        t.objectProperty(
                            t.identifier(resourceName),
                            tpl.expression(template, { placeholderPattern: false })()
                        )
                    );
                }

                if (path.node.name === "HANDLER_APOLLO_GATEWAY_OPTIONS") {
                    const services = path.parent.value.properties.find(
                        item => item.type === "ObjectProperty" && item.key.name === "services"
                    );
                    const newService = t.objectExpression([
                        t.objectProperty(t.identifier("name"), t.stringLiteral(resourceName)),
                        t.objectProperty(
                            t.identifier("function"),
                            t.stringLiteral("${" + resourceName + ".name}")
                        )
                    ]);
                    services.value.elements.push(newService);
                }
            }
        }
    };
};
