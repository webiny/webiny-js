import fs from "fs";
import util from "util";
import path from "path";
import ncpBase from "ncp";
import { runConfig } from "./runConfig";
import { createTsMorphProject } from "~/gen/createTsMorphProject";

const ncp = util.promisify(ncpBase.ncp);

interface ProcessConfigParams {
    projectApplication: any;
}

const runWebsiteAppProcessors = async ({ projectApplication }: ProcessConfigParams) => {
    const pluginsFolderPath = [projectApplication.paths.absolute, "src/plugins"].join("/");

    const reactPluginsFilePath = [
        projectApplication.paths.absolute,
        "src/plugins/reactPlugins.tsx"
    ].join("/");

    const legacyPluginsFilePath = [
        projectApplication.paths.absolute,
        "src/plugins/legacyPlugins.tsx"
    ].join("/");

    const tsMorphProject = createTsMorphProject([reactPluginsFilePath, legacyPluginsFilePath]);

    const { processors: websiteAppProcessors } = require("./appProcessors/website");

    const projectConfig = await runConfig();

    console.log("woot", websiteAppProcessors);
    for (let i = 0; i < websiteAppProcessors.length; i++) {
        console.log("jee");
        const appProcessor = new websiteAppProcessors[i]();
        await appProcessor.process({
            projectApplication,
            projectConfig,
            tsMorphProject: {
                legacyPluginsFile: tsMorphProject.getSourceFile(legacyPluginsFilePath),
                reactPluginsFile: tsMorphProject.getSourceFile(reactPluginsFilePath),
                project: tsMorphProject
            },
            paths: {
                pluginsFolderPath
            }
        });
    }

    tsMorphProject.saveSync();
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

                // await runAdminWorkspaceProcessors({ projectApplication });
            }
        }
    },
    {
        type: "hook-create-app-workspace",
        name: "hook-create-app-workspace-website",
        hook: async ({ projectApplication }: Record<string, any>) => {
            if (projectApplication.id === "website") {
                const from = path.join(__dirname, "templates/apps/website");
                const to = path.join(process.cwd(), ".webiny/workspaces/website");
                await cp(from, to);

                await runWebsiteAppProcessors({ projectApplication });
            }
        }
    }
];
