import { createImplementation } from "@webiny/di";
import {
    BuildAppWorkspaceService,
    GetApp,
    GetAppStackExport,
    PulumiGetStackExportService
} from "~/abstractions/index.js";

export class DefaultGetAppStackExport implements GetAppStackExport.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private buildAppWorkspaceService: BuildAppWorkspaceService.Interface,
        private pulumiGetStackExportService: PulumiGetStackExportService.Interface
    ) {}

    async execute<TExport extends Record<string, any> = Record<string, string>>(
        params: GetAppStackExport.Params
    ) {
        await this.buildAppWorkspaceService.execute(params.app);

        const app = this.getApp.execute(params.app);
        return this.pulumiGetStackExportService.execute<TExport>(app);
    }
}

export const getAppStackExport = createImplementation({
    abstraction: GetAppStackExport,
    implementation: DefaultGetAppStackExport,
    dependencies: [GetApp, BuildAppWorkspaceService, PulumiGetStackExportService]
});
