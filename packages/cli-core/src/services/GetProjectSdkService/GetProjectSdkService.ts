import { createImplementation } from "@webiny/di";
import { getProjectSdk } from "@webiny/project";
import { CliParamsService, GetArgvService, GetProjectSdkService } from "~/abstractions/index.js";

export class DefaultGetProjectSdkService implements GetProjectSdkService.Interface {
    constructor(
        private readonly cliParamsService: CliParamsService.Interface,
        private readonly getArgvService: GetArgvService.Interface
    ) {}

    async execute() {
        const cliParams = this.cliParamsService.get();
        const argv = this.getArgvService.execute();
        return getProjectSdk({
            cwd: cliParams.cwd,
            logging: {
                streamToStdout: argv.showLogs,
                level: argv.logLevel
            }
        });
    }
}

export const getProjectSdkService = createImplementation({
    abstraction: GetProjectSdkService,
    implementation: DefaultGetProjectSdkService,
    dependencies: [CliParamsService, GetArgvService]
});
