const { join, dirname } = require("path");
const findUp = require("find-up");
const { getProjectRoot } = require("@webiny/cli/utils");

module.exports = path => {
    let absPath = path;
    if (!absPath.startsWith("/")) {
        absPath = join(process.cwd(), path);
    }

    absPath = dirname(findUp.sync("Pulumi.yaml", { cwd: absPath }));

    const projectRoot = getProjectRoot();
    const relPath = absPath.replace(projectRoot, "").substr(1);

    const name = absPath.split("/").pop();

    return {
        name,
        path: {
            absolute: absPath,
            relative: relPath,
            project: projectRoot
        }
    };
};
