import { createImplementation } from "@webiny/di";
import { ProjectSdk } from "@webiny/project";
import { CliParamsService, GetArgvService, GetProjectSdkService } from "~/abstractions/index.js";

export class DefaultGetProjectSdkService implements GetProjectSdkService.Interface {
    constructor(
        private readonly cliParamsService: CliParamsService.Interface,
        private readonly getArgvService: GetArgvService.Interface
    ) {}

    async execute(params?: GetProjectSdkService.Params) {
        const cliParams = this.cliParamsService.get();
        const argv = this.getArgvService.execute();

        // ProjectSdk.init() handles caching internally based on env/variant/region
        return ProjectSdk.init({
            cwd: cliParams.cwd,
            logging: {
                streamToStdout: argv.showLogs,
                level: argv.logLevel
            },
            env: params?.env,
            variant: params?.variant,
            region: params?.region
        });
    }
}

export const getProjectSdkService = createImplementation({
    abstraction: GetProjectSdkService,
    implementation: DefaultGetProjectSdkService,
    dependencies: [CliParamsService, GetArgvService]
});
