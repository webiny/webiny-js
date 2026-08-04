import { createFeature } from "@webiny/feature/api";
import { ApiKeysRepository } from "./shared/ApiKeysRepository.js";
import { GetApiKeyFeature } from "./GetApiKey/feature.js";
import { GetApiKeyByTokenFeature } from "./GetApiKeyByToken/feature.js";
import { GetApiKeyBySlugFeature } from "./GetApiKeyBySlug/feature.js";
import { ListApiKeysFeature } from "./ListApiKeys/feature.js";
import { CreateApiKeyFeature } from "./CreateApiKey/feature.js";
import { UpdateApiKeyFeature } from "./UpdateApiKey/feature.js";
import { DeleteApiKeyFeature } from "./DeleteApiKey/feature.js";
import {
    ApiKeyFactory,
    ApiKeyProvider as ApiKeyProviderAbstraction
} from "~/features/security/apiKeys/shared/abstractions.js";
import { ApiKeyProvider } from "./shared/ApiKeyProvider.js";
import { ApiKeyAuthenticator } from "./ApiKeyAuthenticator.js";
import { ApiKeyAuthorizer } from "./ApiKeyAuthorizer.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";

export const ApiKeysFeature = createFeature({
    name: "ApiKeys",
    register(container) {
        // Register repository in singleton scope
        container.register(ApiKeysRepository).inSingletonScope();

        container.registerFactory(ApiKeyProviderAbstraction, () => {
            const tenantContext = container.resolve(TenantContext);
            return new ApiKeyProvider(tenantContext, () => {
                return container.resolveAll(ApiKeyFactory);
            });
        });
        container.register(ApiKeyAuthenticator);
        container.register(ApiKeyAuthorizer);

        // Register all use cases
        GetApiKeyFeature.register(container);
        GetApiKeyByTokenFeature.register(container);
        GetApiKeyBySlugFeature.register(container);
        ListApiKeysFeature.register(container);
        CreateApiKeyFeature.register(container);
        UpdateApiKeyFeature.register(container);
        DeleteApiKeyFeature.register(container);
    }
});
