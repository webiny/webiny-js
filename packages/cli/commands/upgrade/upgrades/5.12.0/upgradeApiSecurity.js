const tsMorph = require("ts-morph");
const { addImportsToSource } = require("../utils");
const FILES = {
    graphql: "api/code/graphql/src/security.ts",
    headlessCMS: "api/code/headlessCMS/src/security.ts"
};

const importName = "securityAdminUsersDynamoDbStorageOperations";

const addElement = ({ context, source }) => {
    const { error } = context;
    /**
     * We need to add plugins to the export default array.
     * That is why we need to get the default export first.
     */
    const exportDefaultExpression = source.getFirstDescendant(node => {
        return tsMorph.Node.isExportAssignment(node) && tsMorph.Node.isDefaultClause(node);
    });
    if (!exportDefaultExpression) {
        error(`Could not find default export in the ${error.hl(file)}.`);
        return;
    }
    /**
     * Then find the array expression and add new elements into it.
     */
    const arrayExpression = exportDefaultExpression.getFirstDescendant(node => {
        return tsMorph.Node.isArrayLiteralExpression(node);
    });
    arrayExpression.addElement(`${importName}()`);
};

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
                elementName: importName,
                importPath: "@webiny/api-security-admin-users-so-ddb",
                addToPlugins: false
            }
        ],
        file
    });

    addElement({
        context,
        source
    });
};

const upgradeHeadlessCMSIndex = async (project, context) => {
    const { info } = context;
    const file = FILES.headlessCMS;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);

    addImportsToSource({
        context,
        source,
        imports: [
            {
                elementName: importName,
                importPath: "@webiny/api-security-admin-users-so-ddb",
                addToPlugins: false
            }
        ],
        file
    });

    addElement({
        context,
        source
    });
};

module.exports = {
    upgradeGraphQLIndex,
    upgradeHeadlessCMSIndex,
    files: FILES
};
