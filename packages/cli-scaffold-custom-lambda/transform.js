module.exports = function({ types: t, template: tpl }, { template, resourceName }) {
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

                if (path.node.name === "HANDLER_APOLLO_GATEWAY_OPTIONS") {
                    const services = path.parent.value.properties.find(
                        item => item.type === "ObjectProperty" && item.key.name === "services"
                    );

                    services.value.elements = services.value.elements.filter(element => {
                        return (
                            element.properties.find(item => item.key.name === "name").value
                                .value !== resourceName
                        );
                    });
                }
            }
        }
    };
};
