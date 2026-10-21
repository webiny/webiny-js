import { NuxtConfig as Abstraction } from "~/features/nuxt/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { MarkdownContentBuilder } from "~/features/nextjs/MarkdownContentBuilder.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { ApiKeysRepository } from "@webiny/api-core/features/security/apiKeys/shared/abstractions.js";

class NuxtConfigImpl implements Abstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private apiKeyRepo: ApiKeysRepository.Interface,
        private publicUrls: PublicUrls.Interface
    ) {}

    async execute(): Abstraction.Return {
        const tenant = this.tenantContext.getTenant();
        const apiKeyResult = await this.apiKeyRepo.getBySlug("frontend-integration");
        const apiKey = apiKeyResult.isOk() ? apiKeyResult.value : null;
        const [apiHost, adminHost] = await Promise.all([
            this.publicUrls.getApiUrl(),
            this.publicUrls.getAdminUrl()
        ]);

        const envVars = [
            `WEBINY_API_KEY={API_TOKEN}`,
            `WEBINY_API_HOST={API_HOST}`,
            `WEBINY_API_TENANT={TENANT_ID}`
        ];

        if (adminHost) {
            envVars.push(`WEBINY_ADMIN_HOST={ADMIN_HOST}`);
        }

        const builder = new MarkdownContentBuilder();
        builder
            .setVariables({
                DESCRIPTION: `This is a configuration for <a href="{STARTER_KIT_LINK}" target="_blank">Webiny Nuxt starter kit:</a>`,
                STARTER_KIT_LINK: `https://github.com/webiny/website-builder-nuxt`,
                API_TOKEN: apiKey ? apiKey.token : "{API_KEY_TOKEN}",
                API_HOST: apiHost ?? "{API_HOST_URL}",
                ADMIN_HOST: adminHost ?? "{ADMIN_HOST_URL}",
                TENANT_ID: tenant.id
            })
            .add("description", "{DESCRIPTION}")
            .add("dotEnvStart", "```dotenv")
            .add("dotEnvBody", envVars.join("\n"))
            .add("dotEnvEnd", "```");

        return builder;
    }
}

export const NuxtConfig = Abstraction.createImplementation({
    implementation: NuxtConfigImpl,
    dependencies: [TenantContext, ApiKeysRepository, PublicUrls]
});
