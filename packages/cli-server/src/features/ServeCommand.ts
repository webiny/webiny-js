import { createImplementation } from "@webiny/di";
import { CliCommandFactory, GetProjectSdkService } from "@webiny/cli-core/abstractions/index.js";

interface IServeCommandParams {
    _: string[];
    app?: string;
}

export class ServerServeCommand implements CliCommandFactory.Interface<IServeCommandParams> {
    constructor(private getProjectSdkService: GetProjectSdkService.Interface) {}

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
                const projectSdk = await this.getProjectSdkService.execute();
                await projectSdk.serve({ app: params.app as any });
            }
        };
    }
}

export const serverServeCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: ServerServeCommand,
    dependencies: [GetProjectSdkService]
});
