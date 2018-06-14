/**
 * This codemod moves `name` and `validators` props from input to <Bind> element and converts validators to array.
 *
 * @param babel
 * @returns {{visitor: {JSXAttribute(*): void}}}
 */
module.exports = function(babel) {
    const { types: t } = babel;

    const convertToArray = value => {
        if (value.type === "StringLiteral") {
            const arr = value.value.split(",").map(v => t.stringLiteral(v));
            return t.JSXExpressionContainer(t.ArrayExpression(arr));
        }

        return value;
    };

    return {
        visitor: {
            // Traverse all element attributes (on all JSX elements)
            JSXAttribute(path) {
                const node = path.node;
                const ref = ["name", "validators"];

                // Only process whitelisted attributes
                if (ref.includes(node.name.name)) {
                    // Find parent <Bind> element wherever it is in the tree
                    const parent = path.findParent(path => {
                        return (
                            path.node.openingElement &&
                            path.node.openingElement.name.name === "Bind"
                        );
                    });

                    // If found, create an attribute from the original element in the parent <Bind>
                    if (parent) {
                        parent.node.openingElement.attributes.push(
                            t.jSXAttribute(
                                node.name,
                                node.name.name === "validators"
                                    ? convertToArray(node.value)
                                    : node.value
                            )
                        );
                        // Remove the attribute from the original element
                        path.remove();
                    }
                }
            }
        }
    };
};
