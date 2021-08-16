const { dirname, basename } = require("path");
const findUp = require("find-up");
const getProject = require("./getProject");
const { importModule } = require("./importModule");

const appConfigs = ["webiny.application.js", "webiny.application.ts"];

module.exports = args => {
    // Using "Pulumi.yaml" for the backwards compatibility.
    const applicationRootFile = findUp.sync(appConfigs.concat("Pulumi.yaml"), { cwd: args.cwd });

    if (!applicationRootFile) {
        throw new Error(`Could not detect project application in given directory (${args.cwd}).`);
    }

    const rootFile = applicationRootFile.replace(/\\/g, "/");
    const applicationRoot = dirname(rootFile);

    let applicationConfig;
    if (appConfigs.includes(basename(rootFile))) {
        applicationConfig = importModule(rootFile);
    }

    let name, id;
    if (applicationConfig) {
        id = applicationConfig.id;
        name = applicationConfig.name;
    } else {
        name = basename(applicationRoot);
        id = name;
    }

    return {
        id,
        name,
        root: applicationRoot,
        config: applicationConfig,
        project: getProject(args)
    };
};
