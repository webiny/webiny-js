import { createImplementation } from "@webiny/di";
import { ProjectSdk } from "@webiny/project";
import {
    CliParamsService,
    GetArgvService,
    GetProjectSdkService
} from "@webiny/cli-core/abstractions/index.js";
import { registerAwsProjectFeatures } from "@webiny/project-aws";

export class AwsGetProjectSdkService implements GetProjectSdkService.Interface {
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
            registerAwsProjectFeatures
        );
    }
}

export const awsGetProjectSdkService = createImplementation({
    abstraction: GetProjectSdkService,
    implementation: AwsGetProjectSdkService,
    dependencies: [CliParamsService, GetArgvService]
});
