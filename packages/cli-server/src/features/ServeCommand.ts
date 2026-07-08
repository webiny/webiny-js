import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    GetProjectSdkService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import { serveApi, serveAdmin, serveAll } from "@webiny/project-server";

interface IServeCommandParams {
    _: string[];
    app?: string;
}

export class ServerServeCommand implements CliCommandFactory.Interface<IServeCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IServeCommandParams>> {
        return {
            name: "serve",
            description:
                "Serves built apps as long-running servers (production). Serves both api and admin if no app is specified.",
            examples: ["serve", "serve api", "serve admin"],
            params: [
                {
                    name: "app",
                    description: "Name of the app to serve (api or admin). Serves both if omitted.",
                    type: "string"
                }
            ],
            handler: async (params: IServeCommandParams) => {
                const ui = this.uiService;
                const projectSdk = await this.getProjectSdkService.execute();

                // No app: serve both api (HTTP handler) and admin (static SPA) at once.
                if (!params.app) {
                    const [apiApp, adminApp] = await Promise.all([
                        projectSdk.getApp("api"),
                        projectSdk.getApp("admin")
                    ]);
                    await serveAll(apiApp, adminApp, ui);
                    return;
                }

                if (params.app === "api") {
                    await serveApi(await projectSdk.getApp("api"), ui);
                    return;
                }

                if (params.app === "admin") {
                    await serveAdmin(await projectSdk.getApp("admin"), ui);
                    return;
                }

                ui.warning(
                    `Unknown app %s. Run one of: %s, %s, or %s.`,
                    `"${params.app}"`,
                    "webiny serve",
                    "webiny serve api",
                    "webiny serve admin"
                );
            }
        };
    }
}

export const serverServeCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: ServerServeCommand,
    dependencies: [GetProjectSdkService, UiService]
});
