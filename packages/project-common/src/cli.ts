import fs from "fs";
import util from "util";
import path from "path";
import ncpBase from "ncp";
import { getPluginsData } from "./getPluginsData";
import { SourceFile } from "ts-morph";

const ncp = util.promisify(ncpBase.ncp);

interface ProjectApplication {
    name: string;
}

interface ConfigHandlerParams {
    projectApplication: ProjectApplication
}

type ConfigHandler = (params: ConfigHandlerParams) => void | Promise<void>;

type ConfigHandlerPlugin = {
    type: string;
    handle: ConfigHandler
}



const configHandlers: ConfigHandlerPlugin[] = [
    {
        type: "theme",
        handle: ({ config: themeConfigs, legacyPluginsFilePath, tsMorphProject }) => {
            const lp: SourceFile = tsMorphProject.getSourceFile(legacyPluginsFilePath);

            for (let i = 0; i < themeConfigs.length; i++) {
                const themeConfig = themeConfigs[i];
            }
        }
    },
    {
        type: "website-public-asset",
        handle: ({ config }) => {
            for (let i = 0; i < config.length; i++) {
                const configElement = config[i];
            }
        }
    }
];

interface ProcessConfigParams {
    projectApplication: ProjectApplication
}

const processConfig = async ({ projectApplication }: ProcessConfigParams) => {
    const pluginsFilePath = [
        process.cwd(),
        ".webiny/workspaces",
        projectApplication.name,
        "src/plugins.tsx"
    ].join("/");

    const legacyPluginsFilePath = [
        process.cwd(),
        ".webiny/workspaces",
        projectApplication.name,
        "src/legacyPlugins.tsx"
    ].join("/");

    // const pluginsIndexCopyFilePath = [process.cwd(), ".webiny/workspaces", "pluginsIndex.tsx"].join(
    //     "/"
    // );
    // console.log(pluginsIndexCopyFilePath);
    //
    // if (fs.existsSync(pluginsIndexCopyFilePath)) {
    //     fs.rmSync(pluginsIndexCopyFilePath, { recursive: true, force: true });
    // }
    //
    // await fs.copyFileSync(pluginsIndexFilePath, pluginsIndexCopyFilePath);
    // await fs.copyFileSync(pluginsIndexFilePath, pluginsIndexCopyFilePath + ".compare.tsx");
    //
    // const tsMorphProject = createTsMorphProject([
    //     pluginsFilePath,
    //     legacyPluginsFilePath,
    //     pluginsIndexFilePath,
    //     pluginsIndexCopyFilePath
    // ]);
    //
    // const src = tsMorphProject.getSourceFile(pluginsIndexCopyFilePath);
    //
    // if (src) {
    //     // Cleanup unused imports.
    //     src.fixUnusedIdentifiers();
    //
    //     const descendantIdentifiers = src.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
    //
    //     const relevantPlugins = descendantIdentifiers.map(identifier => {
    //         const tagName = identifier.getTagNameNode();
    //         if (tagName.getText().startsWith("Website.")) {
    //             return true;
    //         }
    //
    //         identifier.replaceWithText("");
    //     });
    //
    //     // Cleanup unused imports again.
    //     src.fixUnusedIdentifiers();
    //
    //     // Fix existing import paths. For all relative paths, we need to go
    //     // back 2 levels up, and then go into the plugins folder.
    //     const imports = src.getImportDeclarations();
    //     for (let i = 0; i < imports.length; i++) {
    //         const importDeclaration = imports[i];
    //         const moduleSpecifier = importDeclaration.getModuleSpecifier();
    //         const text = moduleSpecifier.getText();
    //         if (text.startsWith('"./')) {
    //             const corrected = text.replace("./", "../../plugins/");
    //             moduleSpecifier.replaceWithText(corrected);
    //         }
    //     }
    // }
    //
    // tsMorphProject.saveSync();

    const config = await getPluginsData();

    console.log(config);

    for (const configKey in config) {
        for (let i = 0; i < configHandlers.length; i++) {
            const configHandler = configHandlers[i];
            if (configHandler.type === configKey) {
                await configHandler.handle({
                    config: config[configKey],
                    projectApplication,
                    tsMorphProject,
                    pluginsFilePath,
                    legacyPluginsFilePath
                });
            }
        }
    }
    process.exit();
};

const cp = async (from: string, to: string) => {
    if (fs.existsSync(to)) {
        fs.rmSync(to, { recursive: true, force: true });
    }

    fs.mkdirSync(to, { recursive: true });
    await ncp(from, to);
    await new Promise(resolve => setTimeout(resolve, 500));
};

// Export hooks plugins for deploy and watch commands.
export default () => [
    {
        type: "hook-create-app-workspace",
        name: "hook-create-app-workspace-types",
        hook: async () => {
            const from = path.join(__dirname, "templates/types");
            const to = path.join(process.cwd(), ".webiny/workspaces/types");
            await cp(from, to);
        }
    },
    {
        type: "hook-create-app-workspace",
        name: "hook-create-app-workspace-admin",
        hook: async ({ projectApplication }: Record<string, any>) => {
            if (projectApplication.name === "admin") {
                const from = path.join(__dirname, "templates/apps/admin");
                const to = path.join(process.cwd(), ".webiny/workspaces/admin");
                await cp(from, to);
            }
        }
    },
    {
        type: "hook-create-app-workspace",
        name: "hook-create-app-workspace-website",
        hook: async ({ projectApplication }: Record<string, any>) => {
            if (projectApplication.name === "website") {
                const from = path.join(__dirname, "templates/apps/website");
                const to = path.join(process.cwd(), ".webiny/workspaces/website");
                await cp(from, to);

                await processConfig({ projectApplication });
            }
        }
    }
];
