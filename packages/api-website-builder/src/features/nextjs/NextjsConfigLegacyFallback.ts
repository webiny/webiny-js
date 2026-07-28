import { NextjsConfig } from "~/features/nextjs/abstractions.js";
import { ApiKeysRepository } from "@webiny/api-core/features/security/apiKeys/shared/abstractions.js";

const LEGACY_PREFIX = "NEXT_PUBLIC_WEBSITE_BUILDER_";
const NEW_PREFIX = "NEXT_PUBLIC_WEBINY_";

class NextjsConfigLegacyFallbackImpl implements NextjsConfig.Interface {
    constructor(
        private apiKeyRepo: ApiKeysRepository.Interface,
        private decoratee: NextjsConfig.Interface
    ) {}

    async execute(): NextjsConfig.Return {
        const builder = await this.decoratee.execute();

        const currentToken = builder.getVariable("API_TOKEN");
        if (currentToken && currentToken !== "{API_KEY_TOKEN}") {
            return builder;
        }

        const legacyKeyResult = await this.apiKeyRepo.getBySlug("website-builder");
        if (legacyKeyResult.isFail()) {
            return builder;
        }

        builder.setVariable("API_TOKEN", legacyKeyResult.value.token);
        builder.replace("dotEnvBody", content => content.replaceAll(NEW_PREFIX, LEGACY_PREFIX));

        return builder;
    }
}

export const NextjsConfigLegacyFallback = NextjsConfig.createDecorator({
    decorator: NextjsConfigLegacyFallbackImpl,
    dependencies: [ApiKeysRepository]
});
