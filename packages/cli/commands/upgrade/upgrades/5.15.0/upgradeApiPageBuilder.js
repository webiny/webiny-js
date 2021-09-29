const { addImportsToSource } = require("../utils");
const tsMorph = require("ts-morph");
const FILES = {
    graphql: "api/code/graphql/src/index.ts",
    pageBuilder: "api/code/pageBuilder/updateSettings/src/index.ts"
};

const { Node, VariableDeclarationKind } = tsMorph;

const pageBuilderDdbEsPlugins = "pageBuilderDynamoDbElasticsearchPlugins";
const pageBuilderPrerenderingPlugins = "pageBuilderPrerenderingPlugins";

const upgradeGraphQLIndex = async (project, context) => {
    const { info } = context;
    const file = FILES.graphql;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);

    addImportsToSource({
        context,
        source,
        imports: [
            {
                elementName: pageBuilderDdbEsPlugins,
                importPath: "@webiny/api-page-builder-so-ddb-es"
            },
            {
                elementName: pageBuilderPrerenderingPlugins,
                importPath: "@webiny/api-page-builder/prerendering"
            }
        ],
        file
    });
};

const upgradePageBuilderIndex = async (project, context) => {
    const { info, error } = context;
    const file = FILES.pageBuilder;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);
    /**
     * First we need to check for the existence of the debug flag
     */
    const debug = source.getFirstDescendant(
        node => Node.isPropertyAssignment(node) && node.getName() === "debug"
    );
    if (!debug) {
        /**
         * Find last import declaration.
         */
        const importDeclarations = source
            .getDescendants()
            .filter(node => Node.isImportDeclaration(node));
        if (importDeclarations.length > 0) {
            /**
             * We need to add the debug variable.
             */
            const lastDeclaration = importDeclarations[importDeclarations.length - 1];
            const index = lastDeclaration.getChildIndex();
            source.insertVariableStatement(index + 1, {
                kind: tsMorph.VariableDeclaration,
                declarationKind: VariableDeclarationKind.Const,
                declarations: [
                    {
                        name: "debug",
                        initializer: `process.env.DEBUG === "true"`,
                        kind: "const"
                    }
                ]
            });
        } else {
            error(`Missing import declarations. Cannot insert the "debug" variable.`);
        }
    }
    /**
     * Also, we need to check if we have the plugins in the createHandler.
     */
    const plugins = source.getFirstDescendant(
        node => Node.isPropertyAssignment(node) && node.getName() === "plugins"
    );
    if (!plugins) {
        const createHandler = source.getFirstDescendant(
            node =>
                Node.isCallExpression(node) && node.getExpression().getText() === "createHandler"
        );
        /**
         * Get the arguments full text (function names + () )
         */
        const args = createHandler.getArguments().map(arg => {
            return arg.getText();
        });
        /**
         * Need to remove all existing arguments.
         */
        args.forEach(() => createHandler.removeArgument(0));
        /**
         * And in the end, add new argument that contains both plugins and http properties.
         */
        createHandler.addArgument(`{plugins: [${args.join(",")}], http: {debug}}`);
    }

    addImportsToSource({
        context,
        source,
        imports: [
            {
                elementName: pageBuilderDdbEsPlugins,
                importPath: "@webiny/api-page-builder-so-ddb-es"
            }
        ],
        file
    });
};

module.exports = {
    upgradeGraphQLIndex,
    upgradePageBuilderIndex,
    files: FILES
};
