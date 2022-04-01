const path = require("path");
const tsMorph = require("ts-morph");
const { log } = require("@webiny/cli/utils");

module.exports.setProjectId = async ({ project, orgId, projectId }) => {
    // Assign the necessary IDs into root `webiny.project.ts` project file.
    const webinyProjectPath = path.join(project.root, "webiny.project.ts");

    const tsMorphProject = new tsMorph.Project();
    tsMorphProject.addSourceFileAtPath(webinyProjectPath);

    const source = tsMorphProject.getSourceFile(webinyProjectPath);

    const defaultExport = source.getFirstDescendant(node => {
        if (tsMorph.Node.isExportAssignment(node) === false) {
            return false;
        }
        return node.getText().startsWith("export default ");
    });

    if (!defaultExport) {
        throw new Error(
            `Could not find the default export in ${log.error.hl("webiny.project.ts")}.`
        );
    }

    // Get ObjectLiteralExpression within the default export and assign the `id` property to it.
    const exportedObjectLiteral = defaultExport.getFirstDescendant(
        node => tsMorph.Node.isObjectLiteralExpression(node) === true
    );

    const existingIdProperty = exportedObjectLiteral.getProperty(node => {
        return tsMorph.Node.isPropertyAssignment(node) && node.getName() === "id";
    });

    const fullId = `${orgId}/${projectId}`;
    if (tsMorph.Node.isPropertyAssignment(existingIdProperty)) {
        existingIdProperty.setInitializer(`"${fullId}"`);
    } else {
        exportedObjectLiteral.insertProperty(0, `id: "${fullId}"`);
    }

    await tsMorphProject.save();
};
