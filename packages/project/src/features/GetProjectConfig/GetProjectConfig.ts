import { createImplementation } from "@webiny/di";
import { GetProjectConfig, GetProjectConfigService } from "~/abstractions/index.js";

export class DefaultGetProjectConfig implements GetProjectConfig.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute(params?: GetProjectConfig.Params) {
        return this.getProjectConfigService.execute(params);
    }
}

export const getProjectConfig = createImplementation({
    abstraction: GetProjectConfig,
    implementation: DefaultGetProjectConfig,
    dependencies: [GetProjectConfigService]
});
