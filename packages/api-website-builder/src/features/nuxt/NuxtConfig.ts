import { NuxtConfig as Abstraction } from "~/features/nuxt/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { MarkdownContentBuilder } from "~/features/nextjs/MarkdownContentBuilder.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { ApiKeysRepository } from "@webiny/api-core/features/security/apiKeys/shared/abstractions.js";

class NuxtConfigImpl implements Abstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private apiKeyRepo: ApiKeysRepository.Interface
    ) {}

    async execute(): Abstraction.Return {
        const tenant = this.tenantContext.getTenant();
        const apiKeyResult = await this.apiKeyRepo.getBySlug("website-builder");
        const apiKey = apiKeyResult.isOk() ? apiKeyResult.value : null;
        const domains = await this.getDomains();

        const envVars = [
            `WEBINY_API_KEY={API_TOKEN}`,
            `WEBINY_API_HOST={API_HOST}`,
            `WEBINY_API_TENANT={TENANT_ID}`
        ];

        if (domains.adminHost) {
            envVars.push(`WEBINY_ADMIN_HOST={ADMIN_HOST}`);
        }

        const builder = new MarkdownContentBuilder();
        builder
            .setVariables({
                DESCRIPTION: `This is a configuration for <a href="{STARTER_KIT_LINK}" target="_blank">Webiny Nuxt starter kit:</a>`,
                STARTER_KIT_LINK: `https://github.com/webiny/website-builder-nuxt`,
                API_TOKEN: apiKey ? apiKey.token : "{API_KEY_TOKEN}",
                API_HOST: domains.apiHost ?? "{API_HOST_URL}",
                ADMIN_HOST: domains.adminHost ?? "{ADMIN_HOST_URL}",
                TENANT_ID: tenant.id
            })
            .add("description", "{DESCRIPTION}")
            .add("dotEnvStart", "```dotenv")
            .add("dotEnvBody", envVars.join("\n"))
            .add("dotEnvEnd", "```");

        return builder;
    }

    private async getDomains() {
        const manifest = await ServiceDiscovery.load();

        const domains: Record<string, string | null> = {
            apiHost: null,
            adminHost: null
        };

        if (!manifest) {
            return domains;
        }

        const { api, admin } = manifest;

        if (api?.cloudfront) {
            domains.apiHost = api.cloudfront.domain;
        }

        if (admin?.cloudfront) {
            domains.adminHost = admin.cloudfront.domain;
        }

        return domains;
    }
}

export const NuxtConfig = Abstraction.createImplementation({
    implementation: NuxtConfigImpl,
    dependencies: [TenantContext, ApiKeysRepository]
});
