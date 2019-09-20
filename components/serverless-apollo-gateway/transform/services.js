module.exports = function({ types }, { services }) {
    const {
        arrayExpression,
        objectExpression,
        objectProperty,
        identifier,
        stringLiteral
    } = types;

    return {
        visitor: {
            Identifier(path) {
                if (path.node.name === "serviceList") {
                    path.parent.value = arrayExpression(
                        services.map(s => {
                            return objectExpression(
                                Object.keys(s).map(key => {
                                    return objectProperty(
                                        identifier(key),
                                        stringLiteral(s[key])
                                    );
                                })
                            );
                        })
                    );
                }
            }
        }
    };
};
