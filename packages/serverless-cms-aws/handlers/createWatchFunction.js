const { createBuildFunction } = require("@webiny/project-utils");
const path = require("path");
const findUp = require("find-up");

module.exports = config => {
    const { cwd } = config;
    const handlersPath = findUp.sync("handlers", { cwd, type: "directory" });
    const distPath = findUp.sync("dist", { cwd, type: "directory" });

    const output = { path: path.join(distPath, "handlers", path.relative(handlersPath, cwd)) };

    return createBuildFunction({
        ...config,
        overrides: { output }
    });
};
