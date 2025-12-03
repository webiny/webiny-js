import { createImplementation } from "@webiny/di";
import { GetCwdService, ProjectSdkParamsService } from "~/abstractions/index.js";

export class DefaultGetCwdService implements GetCwdService.Interface {
    constructor(private readonly projectSdkParamsService: ProjectSdkParamsService.Interface) {}

    execute() {
        const params = this.projectSdkParamsService.get();
        return params.cwd || process.cwd();
    }
}

export const getCwdService = createImplementation({
    abstraction: GetCwdService,
    implementation: DefaultGetCwdService,
    dependencies: [ProjectSdkParamsService]
});
