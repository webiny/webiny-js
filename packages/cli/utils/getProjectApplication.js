const { dirname } = require("path");
const findUp = require("find-up");
const getProject = require("./getProject");

module.exports = args => {
    // Using "Pulumi.yaml" for the backwards compatibility.
    const projectApplicationRootFile =
        findUp.sync("Pulumi.yaml", { cwd: args.cwd }) ||
        findUp.sync("webiny.application.js", { cwd: args.cwd });

    if (!projectApplicationRootFile) {
        throw new Error(`Could not detect project application in given directory (${args.cwd}).`);
    }

    const projectApplicationRoot = dirname(projectApplicationRootFile);

    let projectApplicationConfig;
    if (projectApplicationRootFile.endsWith("webiny.application.js")) {
        projectApplicationConfig = require(projectApplicationRootFile);
    }

    let name;
    if (projectApplicationConfig) {
        name = projectApplicationConfig.name;
    } else {
        name = dirname(projectApplicationRoot);
    }

    return {
        name,
        root: projectApplicationRoot,
        config: projectApplicationConfig,
        project: getProject(args)
    };
};
