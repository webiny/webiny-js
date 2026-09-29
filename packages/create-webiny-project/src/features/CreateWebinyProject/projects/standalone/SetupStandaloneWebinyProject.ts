import fs from "fs-extra";
import path from "path";
import { runInteractivePrompt } from "./runInteractivePrompt.js";
import { CliParams } from "../../../../types.js";
import { GetProjectRootPath } from "../../../../services/index.js";
import { StandaloneProjectParams } from "./types.js";
import { GetTemplatesFolderPath } from "../../../../services/GetTemplatesFolderPath.js";
import { addProjectDependencies } from "../addProjectDependencies.js";
import { addProjectScripts } from "../addProjectScripts.js";

export class SetupStandaloneWebinyProject {
    async execute(cliArgs: CliParams): Promise<StandaloneProjectParams> {
        const standaloneArgs = await this.getStandaloneArgs(cliArgs);

        const getTemplatesFolderPath = new GetTemplatesFolderPath();
        const templatesFolderPath = getTemplatesFolderPath.execute();

        const storageTemplatePath = path.join(
            templatesFolderPath,
            "standalone",
            standaloneArgs.storageOps
        );

        const getProjectRoot = new GetProjectRootPath();
        const projectRootFolderPath = getProjectRoot.execute(cliArgs);

        // Copies the storage-specific template files into the project — `webiny.config.tsx` and a
        // `.env.example` (all vars commented; the project runs on config defaults with no `.env`).
        fs.copySync(storageTemplatePath, projectRootFolderPath);

        // Standalone hosting-type dependencies. The `webiny` CLI (server bin) sets
        // WEBINY_HOSTING_TYPE=standalone; `@webiny/project-standalone` provides the server `Infra.*` extensions
        // and resolves `@webiny/project-standalone-template` (the workspace base config) at build time;
        // `@webiny/self-hosted-auth` is the built-in JWT identity provider (replaces Cognito).
        addProjectDependencies(projectRootFolderPath, {
            "@webiny/cli-standalone": "latest",
            "@webiny/project-standalone": "latest",
            "@webiny/project-standalone-template": "latest",
            "@webiny/self-hosted-auth": "latest"
        });

        // Standalone watches every default app in a single process, so `yarn dev` is all a developer
        // needs to get the whole project running locally. Standalone-only — on AWS the apps are watched
        // separately, so there's no single command to alias.
        addProjectScripts(projectRootFolderPath, {
            dev: "webiny watch"
        });

        return standaloneArgs;
    }

    private async getStandaloneArgs(cliArgs: CliParams) {
        const standaloneArgs: StandaloneProjectParams = {
            storageOps: "sqlite",
            aiAgent: "other"
        };

        const { templateOptions: templateOptionsString } = cliArgs;
        if (templateOptionsString) {
            try {
                Object.assign(standaloneArgs, JSON.parse(templateOptionsString));
            } catch {
                // Do nothing.
            }
        }

        if (cliArgs.interactive !== false) {
            Object.assign(standaloneArgs, await runInteractivePrompt());
        }

        return standaloneArgs;
    }
}
