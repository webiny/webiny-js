import { NextjsConfig as Abstraction } from "~/features/nextjs/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { MarkdownContentBuilder } from "~/features/nextjs/MarkdownContentBuilder.js";
import { ServiceDiscovery } from "@webiny/api";
import { ApiKeysRepository } from "@webiny/api-core/features/security/apiKeys/shared/abstractions.js";

class NextjsConfigImpl implements Abstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private apiKeyRepo: ApiKeysRepository.Interface
    ) {}

    async execute(): Abstraction.Return {
        const tenant = this.tenantContext.getTenant();
        const apiKeyResult = await this.apiKeyRepo.getBySlug("website-builder");
        const apiKey = apiKeyResult.isOk() ? apiKeyResult.value : null;

        const envVars = [
            "<pre>",
            `NEXT_PUBLIC_WEBSITE_BUILDER_API_KEY={API_TOKEN}<br/>`,
            `NEXT_PUBLIC_WEBSITE_BUILDER_API_HOST={API_HOST}<br/>`,
            `NEXT_PUBLIC_WEBSITE_BUILDER_API_TENANT={TENANT_ID}<br/>`,
            "</pre>"
        ];

        const builder = new MarkdownContentBuilder();
        builder
            .setVariables({
                LINK: `https://github.com/webiny/website-builder-nextjs`,
                API_TOKEN: apiKey ? apiKey.token : "{API_KEY_TOKEN}",
                API_HOST: await this.getApiHost(),
                TENANT_ID: tenant.id
            })
            .add(
                "description",
                `This is a configuration for <a href="{LINK}" target="_blank">Webiny Next.js starter kit:</a>`
            )
            .add("config", envVars.join("\n"))
        ;

        return builder;
    }

    private async getApiHost() {
        const manifest = await ServiceDiscovery.load();

        if (!manifest) {
            return "{API_HOST}";
        }

        return manifest.api.cloudfront.domain;
    }
}

export const NextjsConfig = Abstraction.createImplementation({
    implementation: NextjsConfigImpl,
    dependencies: [TenantContext, ApiKeysRepository]
});
