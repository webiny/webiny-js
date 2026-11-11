import { createImplementation } from "@webiny/di";
import { CliParamsService } from "@webiny/cli-core/abstractions/index.js";
import { GetArgvService } from "@webiny/cli-core/abstractions/index.js";
import { AwsProjectSdk } from "@webiny/project-aws/AwsProjectSdk.js";
import { GetAwsProjectSdkService } from "~/abstractions/GetAwsProjectSdkService.js";

export class DefaultGetAwsProjectSdkService implements GetAwsProjectSdkService.Interface {
    constructor(
        private readonly cliParamsService: CliParamsService.Interface,
        private readonly getArgvService: GetArgvService.Interface
    ) {}

    async execute() {
        const cliParams = this.cliParamsService.get();
        const argv = this.getArgvService.execute();

        return AwsProjectSdk.createForCli({
            ...argv,
            cwd: cliParams.cwd,
            logging: {
                streamToStdout: argv.showLogs,
                level: argv.logLevel
            }
        });
    }
}

export const getAwsProjectSdkService = createImplementation({
    abstraction: GetAwsProjectSdkService,
    implementation: DefaultGetAwsProjectSdkService,
    dependencies: [CliParamsService, GetArgvService]
});
