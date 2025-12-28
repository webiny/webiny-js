import { createImplementation } from "@webiny/di";
import {
    BuildAppWorkspaceService,
    GetApp,
    GetAppService,
    GetAppStackOutput,
    PulumiGetStackOutputService
} from "~/abstractions/index.js";

export class DefaultGetAppStackOutput implements GetAppStackOutput.Interface {
    constructor(
        private getAppService: GetApp.Interface,
        private buildAppWorkspaceService: BuildAppWorkspaceService.Interface,
        private pulumiGetStackOutputService: PulumiGetStackOutputService.Interface
    ) {}

    async execute<TOutput extends GetAppStackOutput.StackOutput = GetAppStackOutput.StackOutput>(
        params: GetAppStackOutput.Params
    ) {
        await this.buildAppWorkspaceService.execute(params.app);

        const app = this.getAppService.execute(params.app);
        return this.pulumiGetStackOutputService.execute<TOutput>(app);
    }
}

export const getAppStackOutput = createImplementation({
    abstraction: GetAppStackOutput,
    implementation: DefaultGetAppStackOutput,
    dependencies: [GetAppService, BuildAppWorkspaceService, PulumiGetStackOutputService]
});
