import { createImplementation } from "@webiny/di";
import { ProjectSdk } from "@webiny/project";
import { CliParamsService, GetArgvService, GetProjectSdkService } from "~/abstractions/index.js";

export class DefaultGetProjectSdkService implements GetProjectSdkService.Interface {
    constructor(
        private readonly cliParamsService: CliParamsService.Interface,
        private readonly getArgvService: GetArgvService.Interface
    ) {}

    async execute() {
        const cliParams = this.cliParamsService.get();
        const argv = this.getArgvService.execute();

        // Extract env/variant/region from argv and pass to ProjectSdk.init()
        // ProjectSdk.init() handles caching internally based on these parameters
        return ProjectSdk.init({
            ...argv,
            cwd: cliParams.cwd,
            logging: {
                streamToStdout: argv.showLogs,
                level: argv.logLevel
            },
        });
    }
}

export const getProjectSdkService = createImplementation({
    abstraction: GetProjectSdkService,
    implementation: DefaultGetProjectSdkService,
    dependencies: [CliParamsService, GetArgvService]
});
