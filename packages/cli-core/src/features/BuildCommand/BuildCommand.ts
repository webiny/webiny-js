import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    DefaultAppsService,
    GetProjectSdkService,
    StdioService,
    UiService
} from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { BuildRunner } from "~/features/BuildCommand/buildRunners/BuildRunner.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export interface IBuildCommandParams extends Omit<IBaseAppParams, "app"> {
    app?: string;
    analyze?: boolean;
}

export class BuildCommand implements CliCommandFactory.Interface<IBuildCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface,
        private ui: UiService.Interface,
        private defaultAppsService: DefaultAppsService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IBuildCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "build",
            description: "Builds specified app (or all default apps if none specified)",
            examples: ["$0 build api --env dev", "$0 build admin --env prod", "$0 build"],
            params: [
                {
                    name: "app",
                    description: "Name of the app to build (api or admin)",
                    type: "string",
                    required: false
                }
            ],
            options: [
                ...createBaseAppOptions(projectSdk),
                {
                    name: "analyze",
                    description: "Run bundle analysis during build",
                    type: "boolean"
                }
            ],
            handler: async (params: IBuildCommandParams) => {
                if (params.analyze) {
                    process.env.RSDOCTOR = "true";
                }

                const stdio = this.stdioService;
                const ui = this.ui;

                const apps = params.app ? [params.app] : await this.defaultAppsService.execute();

                if (apps.length === 0) {
                    ui.error(`Please specify an app to build, for example: %s`, "webiny build api");
                    return;
                }

                for (const app of apps) {
                    const packagesBuilder = await projectSdk.buildApp({
                        ...params,
                        app: app as IBaseAppParams["app"]
                    });

                    const buildRunner = new BuildRunner({ stdio, ui, packagesBuilder });
                    await buildRunner.run();

                    if (apps.length > 1) {
                        ui.emptyLine();
                    }
                }
            }
        };
    }
}

export const buildCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: BuildCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService, DefaultAppsService]
});
