import { UiService } from "@webiny/project/abstractions/index.js";
import { GetPulumiService } from "~/abstractions/services/GetPulumiService.js";

export class GetPulumiServiceWithDownloadInfo implements GetPulumiService.Interface {
    constructor(
        private ui: UiService.Interface,
        private decoratee: GetPulumiService.Interface
    ) {}

    async execute(params: GetPulumiService.Params = {}) {
        const pulumiOptions = params.pulumiOptions || {};
        const beforePulumiInstall = pulumiOptions.beforePulumiInstall;

        return this.decoratee.execute({
            ...params,
            pulumiOptions: {
                ...pulumiOptions,
                beforePulumiInstall: async () => {
                    this.ui.info("Downloading Pulumi CLI...");

                    // New line b/c after the Pulumi CLI download, plugins are next.
                    this.ui.emptyLine();

                    await beforePulumiInstall?.();
                }
            }
        });
    }
}

export const getPulumiServiceWithDownloadInfo = GetPulumiService.createDecorator({
    decorator: GetPulumiServiceWithDownloadInfo,
    dependencies: [UiService]
});
