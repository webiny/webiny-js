const { join, dirname } = require("path");
const findUp = require("find-up");

module.exports = path => {
    let absPath = path;
    if (!absPath.startsWith("/")) {
        absPath = join(process.cwd(), path);
    }

    absPath = dirname(findUp.sync("Pulumi.yaml", { cwd: absPath }));

    const projectPath = dirname(findUp.sync("webiny.root.js"));
    const relPath = absPath.replace(projectPath, "").substr(1);

    const name = absPath.split("/").pop();

    return {
        name,
        path: {
            absolute: absPath,
            relative: relPath,
            project: projectPath
        }
    };
};
