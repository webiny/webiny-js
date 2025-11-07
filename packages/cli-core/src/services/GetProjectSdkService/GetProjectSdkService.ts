import { createImplementation } from "@webiny/di";
import { getProjectSdk } from "@webiny/project";
import { CliParamsService, GetProjectSdkService } from "~/abstractions/index.js";

export class DefaultGetProjectSdkService implements GetProjectSdkService.Interface {
    constructor(private readonly cliParamsService: CliParamsService.Interface) {}

    async execute() {
        const cliParams = this.cliParamsService.get();
        return getProjectSdk(cliParams);
    }
}

export const getProjectSdkService = createImplementation({
    abstraction: GetProjectSdkService,
    implementation: DefaultGetProjectSdkService,
    dependencies: [CliParamsService]
});
