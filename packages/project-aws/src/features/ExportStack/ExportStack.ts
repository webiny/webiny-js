import { createImplementation } from "@webiny/di";
import { BuildAppWorkspaceService } from "@webiny/project/abstractions/index.js";
import { GetApp } from "@webiny/project/abstractions/index.js";
import { ExportStack } from "~/abstractions/features/ExportStack.js";
import { PulumiExportService } from "~/abstractions/services/PulumiExportService.js";

export class DefaultExportStack implements ExportStack.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private buildAppWorkspaceService: BuildAppWorkspaceService.Interface,
        private pulumiExportService: PulumiExportService.Interface
    ) {}

    async execute<TExport extends Record<string, any> = Record<string, string>>(
        params: ExportStack.Params
    ) {
        await this.buildAppWorkspaceService.execute(params.app);

        const app = this.getApp.execute(params.app);
        return this.pulumiExportService.execute<TExport>(app);
    }
}

export const exportStack = createImplementation({
    abstraction: ExportStack,
    implementation: DefaultExportStack,
    dependencies: [GetApp, BuildAppWorkspaceService, PulumiExportService]
});
