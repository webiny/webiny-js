// @ts-nocheck
const removeImportDeclaration = path => {
    let node = path.parentPath;
    while (node) {
        if (node.type === "ImportDeclaration" && !node.removed) {
            node.remove();
            return;
        }

        node = node.parentPath;
    }
};

const removePluginCreation = path => {
    let node = path.parentPath;
    while (node) {
        if (node.type === "ExportNamedDeclaration" && !node.removed) {
            node.remove();
            return;
        }

        node = node.parentPath;
    }
};

export default function (babel) {
    const { types: t } = babel;

    return {
        visitor: {
            Identifier(path) {
                if (path.node.name === "definePlugin") {
                    removeImportDeclaration(path);
                    removePluginCreation(path);
                }
            }
        }
    };
}
