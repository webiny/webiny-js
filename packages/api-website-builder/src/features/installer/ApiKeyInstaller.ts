import { AppInstaller } from "@webiny/api-core/features/InstallTenant";
import { CreateApiKeyUseCase } from "@webiny/api-core/features/security/apiKeys/CreateApiKey/index.js";
import { DeleteApiKeyUseCase } from "@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.js";
import type { ApiKey } from "@webiny/api-core/types/security.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

class ApiKeyInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "WebsiteBuilder";
    readonly dependsOn = [];
    private apiKey: ApiKey | undefined = undefined;

    constructor(
        private wcpContext: WcpContext.Interface,
        private createApiKey: CreateApiKeyUseCase.Interface,
        private deleteApiKey: DeleteApiKeyUseCase.Interface
    ) {}

    async install(): Promise<void> {
        const aacl = this.wcpContext.canUseAacl();

        const permissions = aacl ? [{ name: "wb.page", rwd: "r" }] : [{ name: "wb.*" }];

        const result = await this.createApiKey.execute({
            name: "Website Builder",
            description: "Integrate Next.js or custom frontend with Website Builder.",
            slug: "website-builder",
            permissions
        });

        if (result.isOk()) {
            this.apiKey = result.value;
        }
    }

    async uninstall(): Promise<void> {
        if (this.apiKey) {
            await this.deleteApiKey.execute(this.apiKey.id);
        }
    }
}

export const ApiKeyInstaller = AppInstaller.createImplementation({
    implementation: ApiKeyInstallerImpl,
    dependencies: [WcpContext, CreateApiKeyUseCase, DeleteApiKeyUseCase]
});
