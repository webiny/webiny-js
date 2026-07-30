import fs from "fs-extra";
import path from "path";
import { runInteractivePrompt } from "./runInteractivePrompt.js";
import { CliParams } from "../../../../types.js";
import { GetProjectRootPath } from "../../../../services/index.js";
import { ServerProjectParams, StorageOps } from "./types.js";
import { GetTemplatesFolderPath } from "../../../../services/GetTemplatesFolderPath.js";
import { addProjectDependencies } from "../addProjectDependencies.js";

// The database section of `.env` depends on the chosen storage.
const DB_ENV: Record<StorageOps, string> = {
    sqlite: `# SQLite database file (relative paths resolve against the project root).
WEBINY_SQL_FILENAME=./.webiny/server.sqlite`,
    postgres: `# Postgres connection.
WEBINY_PG_HOST=localhost
WEBINY_PG_PORT=5432
WEBINY_PG_USER=postgres
WEBINY_PG_PASSWORD=postgres
WEBINY_PG_DATABASE=webiny`
};

const buildDotEnv = (
    storageOps: StorageOps
) => `# Self-hosted (server) hosting-type environment variables.
# The values below are safe dev defaults. CHANGE the secrets before any real deployment.

# Ports the API and Admin servers listen on during \`webiny watch\` / \`webiny serve\`.
WEBINY_API_PORT=3002
WEBINY_ADMIN_PORT=3001

# Public origin of the API (used by the Admin app + for file-upload URLs).
WEBINY_API_URL=http://localhost:3002

${DB_ENV[storageOps]}

# Local file storage for uploaded files + upload signing secret.
WEBINY_LOCAL_STORAGE_PATH=./.webiny/storage
WEBINY_UPLOAD_SECRET=dev-only-insecure-upload-secret

# JWT signing secret for the built-in self-hosted identity provider.
WEBINY_SELF_HOSTED_AUTH_SECRET=dev-only-insecure-secret
`;

export class SetupServerWebinyProject {
    async execute(cliArgs: CliParams): Promise<ServerProjectParams> {
        const serverArgs = await this.getServerArgs(cliArgs);

        const getTemplatesFolderPath = new GetTemplatesFolderPath();
        const templatesFolderPath = getTemplatesFolderPath.execute();

        const storageTemplatePath = path.join(templatesFolderPath, "server", serverArgs.storageOps);

        const getProjectRoot = new GetProjectRootPath();
        const projectRootFolderPath = getProjectRoot.execute(cliArgs);

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

        // Write the `.env` with the server hosting-type dev defaults (DB section matches the choice).
        fs.writeFileSync(
            path.join(projectRootFolderPath, ".env"),
            buildDotEnv(serverArgs.storageOps)
        );

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
