import fs from "fs-extra";
import path from "path";
import { runInteractivePrompt } from "./runInteractivePrompt.js";
import { CliParams } from "../../../../types.js";
import { GetProjectRootPath } from "../../../../services/index.js";
import { ServerProjectParams } from "./types.js";
import { GetTemplatesFolderPath } from "../../../../services/GetTemplatesFolderPath.js";
import { addProjectDependencies } from "../addProjectDependencies.js";
import { addProjectScripts } from "../addProjectScripts.js";

export class SetupServerWebinyProject {
    async execute(cliArgs: CliParams): Promise<ServerProjectParams> {
        const serverArgs = await this.getServerArgs(cliArgs);

        const getTemplatesFolderPath = new GetTemplatesFolderPath();
        const templatesFolderPath = getTemplatesFolderPath.execute();

        const storageTemplatePath = path.join(templatesFolderPath, "server", serverArgs.storageOps);

        const getProjectRoot = new GetProjectRootPath();
        const projectRootFolderPath = getProjectRoot.execute(cliArgs);

        // Copies the storage-specific template files into the project — `webiny.config.tsx` and a
        // `.env.example` (all vars commented; the project runs on config defaults with no `.env`).
        fs.copySync(storageTemplatePath, projectRootFolderPath);

        // Server (self-hosted) hosting-type dependencies. The `webiny` CLI (server bin) sets
        // WEBINY_HOSTING_TYPE=server; `@webiny/project-server` provides the server `Infra.*` extensions
        // and resolves `@webiny/project-server-template` (the workspace base config) at build time;
        // `@webiny/self-hosted-auth` is the built-in JWT identity provider (replaces Cognito).
        addProjectDependencies(projectRootFolderPath, {
            "@webiny/cli-server": "latest",
            "@webiny/project-server": "latest",
            "@webiny/project-server-template": "latest",
            "@webiny/self-hosted-auth": "latest"
        });

        // Self-hosted watches every default app in a single process, so `yarn dev` is all a developer
        // needs to get the whole project running locally. Server-only — on AWS the apps are watched
        // separately, so there's no single command to alias.
        addProjectScripts(projectRootFolderPath, {
            dev: "webiny watch"
        });

        return serverArgs;
    }

    private async getServerArgs(cliArgs: CliParams) {
        const serverArgs: ServerProjectParams = {
            storageOps: "sqlite",
            aiAgent: "other"
        };

        const { templateOptions: templateOptionsString } = cliArgs;
        if (templateOptionsString) {
            try {
                Object.assign(serverArgs, JSON.parse(templateOptionsString));
            } catch {
                // Do nothing.
            }
        }

        if (cliArgs.interactive !== false) {
            Object.assign(serverArgs, await runInteractivePrompt());
        }

        return serverArgs;
    }
}
