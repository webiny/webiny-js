import { NextjsConfig as Abstraction } from "~/features/nextjs/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { MarkdownContentBuilder } from "~/features/nextjs/MarkdownContentBuilder.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { ApiKeysRepository } from "@webiny/api-core/features/security/apiKeys/shared/abstractions.js";

class NextjsConfigImpl implements Abstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private apiKeyRepo: ApiKeysRepository.Interface,
        private publicUrls: PublicUrls.Interface
    ) {}

    async execute(): Abstraction.Return {
        const tenant = this.tenantContext.getTenant();
        const apiKeyResult = await this.apiKeyRepo.getBySlug("frontend-integration");
        const apiKey = apiKeyResult.isOk() ? apiKeyResult.value : null;
        const apiHost = await this.publicUrls.getApiUrl();
        const adminHost = await this.publicUrls.getAdminUrl();

        const envVars = [
            `NEXT_PUBLIC_WEBINY_API_KEY={API_TOKEN}`,
            `NEXT_PUBLIC_WEBINY_API_HOST={API_HOST}`,
            `NEXT_PUBLIC_WEBINY_API_TENANT={TENANT_ID}`
        ];

        if (adminHost.isKnown()) {
            envVars.push(`NEXT_PUBLIC_WEBINY_ADMIN_HOST={ADMIN_HOST}`);
        }

        const builder = new MarkdownContentBuilder();
        builder
            .setVariables({
                DESCRIPTION: `This is a configuration for <a href="{STARTER_KIT_LINK}" target="_blank">Webiny Next.js starter kit:</a>`,
                STARTER_KIT_LINK: `https://github.com/webiny/website-builder-nextjs`,
                API_TOKEN: apiKey ? apiKey.token : "{API_KEY_TOKEN}",
                API_HOST: apiHost.orElse("{API_HOST_URL}"),
                ADMIN_HOST: adminHost.orElse("{ADMIN_HOST_URL}"),
                TENANT_ID: tenant.id
            })
            .add("description", "{DESCRIPTION}")
            .add("dotEnvStart", "```dotenv")
            .add("dotEnvBody", envVars.join("\n"))
            .add("dotEnvEnd", "```");

        return builder;
    }
}

export const NextjsConfig = Abstraction.createImplementation({
    implementation: NextjsConfigImpl,
    dependencies: [TenantContext, ApiKeysRepository, PublicUrls]
});
