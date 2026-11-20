import { GetProjectService } from "@webiny/project/abstractions/index.js";
import { UiService } from "@webiny/project/abstractions/index.js";
import { GetPulumiService } from "~/abstractions/services/GetPulumiService.js";

export class GetPulumiServiceWithDownloadInfo implements GetPulumiService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private ui: UiService.Interface,
        private decoratee: GetPulumiService.Interface
    ) {}

    async execute(params: GetPulumiService.Params = {}) {
        const project = this.getProjectService.execute();
        const pulumiCliPath = project.paths.dotWebinyFolder.join("pulumi-cli");

        if (!pulumiCliPath.existsSync()) {
            this.ui.info("Looks like this is your first time using Pulumi CLI. Downloading...");

            // New line b/c after the Pulumi CLI download, plugins are next.
            this.ui.emptyLine();
        }

        return this.decoratee.execute(params);
    }
}

export const getPulumiServiceWithDownloadInfo = GetPulumiService.createDecorator({
    decorator: GetPulumiServiceWithDownloadInfo,
    dependencies: [GetProjectService, UiService]
});
