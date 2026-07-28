import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { CreateApiKeyUseCase } from "@webiny/api-core/features/security/apiKeys/CreateApiKey/index.js";
import { DeleteApiKeyUseCase } from "@webiny/api-core/features/security/apiKeys/DeleteApiKey/index.js";
import type { ApiKey } from "@webiny/api-core/types/security.js";

class ApiKeyInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "WebsiteBuilder";
    readonly dependsOn = [];
    private apiKey: ApiKey | undefined = undefined;

    constructor(
        private createApiKey: CreateApiKeyUseCase.Interface,
        private deleteApiKey: DeleteApiKeyUseCase.Interface
    ) {}

    async install(): Promise<void> {
        const result = await this.createApiKey.execute({
            name: "Frontend Integration",
            description: "Integrate Next.js or any other frontend with Webiny.",
            slug: "frontend-integration",
            // Configure read-only permissions for CMS, Website Builder, and Languages
            permissions: [
                {
                    name: "$languages.readonly"
                },
                {
                    name: "languages.*",
                    rwd: "r"
                },
                {
                    name: "cms.endpoint.read"
                },
                {
                    pw: null,
                    rwd: "r",
                    name: "cms.contentModel",
                    own: false
                },
                {
                    own: false,
                    name: "cms.contentModelGroup",
                    rwd: "r",
                    pw: null
                },
                {
                    rwd: "r",
                    own: false,
                    pw: null,
                    name: "cms.contentEntry"
                },
                {
                    name: "$wb.readonly"
                },
                {
                    name: "wb.*",
                    rwd: "r"
                }
            ]
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
    dependencies: [CreateApiKeyUseCase, DeleteApiKeyUseCase]
});
