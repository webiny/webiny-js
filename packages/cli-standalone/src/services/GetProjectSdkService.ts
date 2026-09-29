import { createImplementation } from "@webiny/di";
import { ProjectSdk } from "@webiny/project";
import {
    CliParamsService,
    GetArgvService,
    GetProjectSdkService
} from "@webiny/cli-core/abstractions/index.js";
import { registerStandaloneProjectFeatures } from "@webiny/project-standalone";

export class ServerGetProjectSdkService implements GetProjectSdkService.Interface {
    constructor(
        private readonly cliParamsService: CliParamsService.Interface,
        private readonly getArgvService: GetArgvService.Interface
    ) {}

    async execute() {
        const cliParams = this.cliParamsService.get();
        const argv = this.getArgvService.execute();

        return ProjectSdk.init(
            {
                ...argv,
                cwd: cliParams.cwd,
                logging: {
                    streamToStdout: argv.showLogs,
                    level: argv.logLevel
                }
            },
            registerStandaloneProjectFeatures
        );
    }
}

export const serverGetProjectSdkService = createImplementation({
    abstraction: GetProjectSdkService,
    implementation: ServerGetProjectSdkService,
    dependencies: [CliParamsService, GetArgvService]
});
