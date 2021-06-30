const { Node } = require("ts-morph");

const FILES = {
    websitePbPlugins: "apps/website/code/src/plugins/pageBuilder.ts",
    websiteApolloClient: "apps/website/code/src/components/apolloClient.ts"
};

const upgradeApolloCachePlugins = async (tsmProject, context) => {
    const { info } = context;

    info(`Updating ${info.hl(upgradeApolloCachePlugins.files.websitePbPlugins)}`);

    // 1. Update Apollo Clients...
    {
        let source = tsmProject.getSourceFile(FILES.websiteApolloClient);
        const dataIdFromObjectProperty = source.getFirstDescendant(node => {
            if (Node.isPropertyAssignment(node) && node.getName() === "dataIdFromObject") {
                return node;
            }
        });

        dataIdFromObjectProperty.setInitializer(dataIdFromObjectValueInitializer);

        const importDeclarations = source.getImportDeclarations();
        const lastImportDeclaration = importDeclarations[importDeclarations.length - 1];
        const index = lastImportDeclaration.getChildIndex() + 1;

        source.insertImportDeclaration(index, {
            defaultImport: "{ plugins }",
            moduleSpecifier: "@webiny/plugins"
        });

        source.insertImportDeclaration(index + 1, {
            defaultImport: "{ ApolloCacheObjectIdPlugin }",
            moduleSpecifier: "@webiny/app/plugins/ApolloCacheObjectIdPlugin"
        });
    }

    // 2. Update "apps/website/code/src/plugins/pageBuilder.ts"...
    {
        let source = tsmProject.getSourceFile(FILES.websitePbPlugins);
        const importDeclarations = source.getImportDeclarations();
        const lastImportDeclaration = importDeclarations[importDeclarations.length - 1];
        const index = lastImportDeclaration.getChildIndex() + 1;

        source.insertImportDeclaration(index, {
            defaultImport: "apolloCacheObjectId",
            moduleSpecifier: "@webiny/app-page-builder/render/plugins/apolloCacheObjectId"
        });

        const defaultExport = source.getFirstDescendant(node => Node.isExportAssignment(node));
        const exportedArray = defaultExport.getFirstDescendant(node =>
            Node.isArrayLiteralExpression(node)
        );
        exportedArray.addElement("apolloCacheObjectId");
    }
};

upgradeApolloCachePlugins.files = FILES;

module.exports = {
    upgradeApolloCachePlugins
};

const dataIdFromObjectValueInitializer = `obj => {
            /**
             * Since every data type coming from API can have a different data structure,
             * we cannot rely on having an \`id\` field.
             */
            const getters = plugins.byType<ApolloCacheObjectIdPlugin>(
                ApolloCacheObjectIdPlugin.type
            );

            for (let i = 0; i < getters.length; i++) {
                const id = getters[i].getObjectId(obj);
                if (typeof id !== "undefined") {
                    return id;
                }
            }

            /**
             * As a fallback, try getting object's \`id\`.
             */
            return obj.id || null;
        }`;
