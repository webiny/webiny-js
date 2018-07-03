// @flowIgnore
module.exports = function({ types: t }) {
    function createVariable(identifier, value) {
        const variable = t.variableDeclarator(t.identifier(identifier), t.stringLiteral(value));
        return t.variableDeclaration("const", [variable]);
    }

    return {
        visitor: {
            TypeAlias(path, state) {
                const { node } = path;
                if (node.id.name !== "Props") {
                    return;
                }

                const props = state.file.code.substr(node.start, node.end - node.start);

                path.replaceWith(t.exportNamedDeclaration(createVariable("PropsType", props), []));
            }
        }
    };
};
