module.exports = args => {
    const { join, relative, dirname } = require("path");
    const findUp = require("find-up");
    const { importModule } = require("./importModule");
    const glob = require("fast-glob");
    const getProject = require("./getProject");

    // Using "Pulumi.yaml" for the backwards compatibility.
    const project = getProject(args);
    if (!project) {
        throw new Error(`Could not detect project in given directory (${args.name}).`);
    }

    const appWorkspacePath = join(project.root, ".webiny", "workspaces", args.name);

    const webinyAppTsPath = findUp.sync("webiny.application.ts", { cwd: appWorkspacePath });
    if (!webinyAppTsPath) {
        throw new Error(`Could not detect project application in given directory (${args.name}).`);
    }

    let applicationConfig = importModule(webinyAppTsPath);

    const id = applicationConfig.id;
    const name = applicationConfig.name;
    const description = applicationConfig.description;

    const appRelativePath = relative(project.root, appWorkspacePath);

    return {
        id,
        name,
        description,
        root: appWorkspacePath,
        paths: {
            relative: appRelativePath,
            absolute: appWorkspacePath
        },
        config: applicationConfig,
        project,
        get packages() {
            const webinyConfigPaths = glob.sync(
                join(appWorkspacePath, "**/webiny.config.ts").replace(/\\/g, "/")
            );

            return webinyConfigPaths.map(path => {
                return {
                    paths: {
                        root: dirname(path),
                        config: path
                    },
                    get config() {
                        return require(path).default || require(path);
                    }
                };
            });
        }
    };
};
