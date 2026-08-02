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
            name: "Website Builder",
            description: "Integrate Next.js or custom frontend with Website Builder.",
            slug: "website-builder",
            // Mirrors exactly what Admin writes when you pick the "Read-only" access level for
            // Website Builder (see `usePermissionForm`).
            //
            // `$wb.readonly` carries no authorization weight — it exists so the Admin form can
            // round-trip the chosen access level (`deserializePermissions` looks for it first).
            // Drop it and the key still works, but Admin renders it as "Custom access". Keep it.
            //
            // `wb.*` + `rwd: "r"` grants read on every Website Builder entity (page, redirect, and
            // anything added later) without granting writes — `hasFullSchemaAccess` deliberately
            // does not treat a permission carrying `rwd` as full access. Enumerating entities
            // individually is what left the frontend unable to read redirects.
            permissions: [{ name: "$wb.readonly" }, { name: "wb.*", rwd: "r" }]
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
