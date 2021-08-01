const tsMorph = require("ts-morph");
const { addImportsToSource } = require("../utils");

const FILES = {
    headlessCMS: "apps/admin/code/src/plugins/headlessCms.ts"
};

const upgradeAppHeadlessCMS = async (project, context) => {
    const { info, error } = context;
    const file = FILES.headlessCMS;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);

    const imports = [
        {
            elementName: "objectField",
            importPath: "@webiny/app-headless-cms/admin/plugins/fields/object",
            addToPlugins: false
        },
        {
            elementName: "objectFieldRenderer",
            importPath: "@webiny/app-headless-cms/admin/plugins/fieldRenderers/object",
            addToPlugins: false
        }
    ];

    addImportsToSource({
        context,
        source,
        imports,
        file
    });
    /**
     * We need to add plugins to the export default array.
     * That is why we need to get the default export first.
     */
    const exportDefaultExpression = source.getFirstDescendant(node => {
        return tsMorph.Node.isExportAssignment(node);
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
    for (const i of imports) {
        arrayExpression.addElement(i.elementName);
    }
};

module.exports = {
    upgradeAppHeadlessCMS,
    files: FILES
};
