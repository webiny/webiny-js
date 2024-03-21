const { dirname, basename, join, relative } = require("path");
const findUp = require("find-up");
const getProject = require("./getProject");
const { importModule } = require("./importModule");
const glob = require("fast-glob");

const appConfigs = ["webiny.application.js", "webiny.application.ts"];

module.exports = args => {
    // Using "Pulumi.yaml" for the backwards compatibility.
    const applicationRootFile = findUp.sync(appConfigs.concat("Pulumi.yaml"), { cwd: args.cwd });

    if (!applicationRootFile) {
        throw new Error(`Could not detect project application in given directory (${args.cwd}).`);
    }

    const rootFile = applicationRootFile.replace(/\\/g, "/");
    const projectAppRootPath = dirname(rootFile);

    let applicationConfig;
    if (appConfigs.includes(basename(rootFile))) {
        applicationConfig = importModule(rootFile);
    }

    let id, name, description;
    if (applicationConfig) {
        id = applicationConfig.id;
        name = applicationConfig.name;
        description = applicationConfig.description;
    } else {
        name = basename(projectAppRootPath);
        description = name;
        id = name;
    }

    const project = getProject(args);

    const projectAppRelativePath = relative(project.root, projectAppRootPath);
    const projectAppWorkspacePath = join(
        project.root,
        ".webiny",
        "workspaces",
        projectAppRelativePath
    );

    return {
        id,
        name,
        description,
        root: projectAppRootPath,
        paths: {
            relative: projectAppRelativePath,
            absolute: projectAppRootPath,
            workspace: projectAppWorkspacePath
        },
        config: applicationConfig,
        project,
        get packages() {
            const webinyConfigs = glob.sync(
                join(projectAppRootPath, "**/webiny.config*.{ts,js}").replace(/\\/g, "/")
            );

            return webinyConfigs.map(config => {
                const dirPath = dirname(config);
                const packageJson = require(join(dirPath, "package.json"));
                return {
                    name: packageJson.name,
                    paths: {
                        absolute: dirname(config),
                        relative: relative(project.root, dirPath),
                        root: dirname(config),
                        packageJson: join(dirPath, "package.json"),
                        config
                    },
                    packageJson,
                    get config() {
                        return require(config).default || require(config);
                    }
                };
            });
        }
    };
};
