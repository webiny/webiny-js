const { join, dirname } = require("path");
const findUp = require("find-up");

module.exports = path => {
    const absPath = path.startsWith("/") ? path : join(process.cwd(), path);

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
