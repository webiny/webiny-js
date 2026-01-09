import { GetProjectService, GetPulumiService, UiService } from "~/abstractions/index.js";

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
            this.ui.info("Downloading pulumi cli...");
        }

        return this.decoratee.execute(params);
    }
}

export const getPulumiServiceWithDownloadInfo = GetPulumiService.createDecorator({
    decorator: GetPulumiServiceWithDownloadInfo,
    dependencies: [GetProjectService, UiService]
});
