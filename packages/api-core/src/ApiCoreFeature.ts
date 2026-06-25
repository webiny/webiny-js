import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { EventPublisherFeature } from "~/features/eventPublisher/feature.js";
import { LoggerFeature } from "~/features/logger/feature.js";
import { SecurityFeature } from "~/features/security/SecurityFeature.js";
import { SystemFeature } from "~/features/system/SystemFeature.js";
import { TenancyFeature } from "./features/tenancy/TenancyFeature.js";
import { AdminUsersFeature } from "~/features/users/AdminUsersFeature.js";
import { IdpAuthenticatorFeature } from "~/idp/feature.js";
import { KeyValueStoreFeature } from "~/features/keyValueStore/feature.js";
import { BuildParamsFeature } from "~/features/buildParams/feature.js";
import { EncryptionFeature } from "~/features/encryption/feature.js";
import { FeatureFlagsFeature } from "~/features/featureFlags/feature.js";
import { MaskerFeature } from "~/features/masker/feature.js";
import { AiFeature } from "~/features/ai/feature.js";
import { NullWebhookDispatcher } from "./features/webhooks/WebhookDispatcher/NullWebhookDispatcher.js";
import { WebhookProviderFeature } from "~/features/webhooks/index.js";

export const ApiCoreFeature = createFeature({
    name: "ApiCore",
    register(container: Container) {
        // Register features
        MaskerFeature.register(container);
        AiFeature.register(container);
        LoggerFeature.register(container);
        EventPublisherFeature.register(container);
        BuildParamsFeature.register(container);
        EncryptionFeature.register(container);
        FeatureFlagsFeature.register(container);
        TenancyFeature.register(container);
        SecurityFeature.register(container);
        AdminUsersFeature.register(container);
        KeyValueStoreFeature.register(container);
        SystemFeature.register(container);
        IdpAuthenticatorFeature.register(container);
        container.register(NullWebhookDispatcher).inSingletonScope();
        WebhookProviderFeature.register(container);
    }
});
