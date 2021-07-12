const { addImportsToSource } = require("../utils");
const FILES = {
    graphql: "api/code/graphql/src/index.ts",
    headlessCMS: "api/code/headlessCMS/src/index.ts"
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
                elementName: "i18nDynamoDbStorageOperations",
                importPath: "@webiny/api-i18n-ddb"
            },
            {
                elementName: "dynamoDbPlugins",
                importPath: "@webiny/db-dynamodb/plugins"
            }
        ],
        file
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
                elementName: "i18nDynamoDbStorageOperations",
                importPath: "@webiny/api-i18n-ddb"
            },
            {
                elementName: "dynamoDbPlugins",
                importPath: "@webiny/db-dynamodb/plugins"
            }
        ],
        file
    });
};

module.exports = {
    upgradeGraphQLIndex,
    upgradeHeadlessCMSIndex,
    files: FILES
};
