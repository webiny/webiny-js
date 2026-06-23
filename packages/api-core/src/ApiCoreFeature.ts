import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { EventPublisherFeature } from "~/features/eventPublisher/feature.js";
import { LoggerFeature } from "~/features/logger/feature.js";
import { SecurityFeature } from "~/features/security/SecurityFeature.js";
import { SystemFeature } from "~/features/system/SystemFeature.js";
import { TenancyFeature } from "./features/tenancy/TenancyFeature.js";
import { AdminUsersFeature } from "~/features/users/AdminUsersFeature.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";
import { IdpAuthenticatorFeature } from "~/idp/feature.js";
import { KeyValueStoreFeature } from "~/features/keyValueStore/feature.js";
import { BuildParamsFeature } from "~/features/buildParams/feature.js";
import { EncryptionFeature } from "~/features/encryption/feature.js";
import { FeatureFlagsFeature } from "~/features/featureFlags/feature.js";
import { MaskerFeature } from "~/features/masker/feature.js";
import { AiFeature } from "~/features/ai/feature.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { NullLicense } from "@webiny/wcp";
import { NullWebhookDispatcher } from "./features/webhooks/WebhookDispatcher/NullWebhookDispatcher.js";
import { WebhookProviderFeature } from "~/features/webhooks/index.js";
import { ApiCoreContextEnhancerImpl } from "~/graphql/ApiCoreContextEnhancer.js";
import { ApiCoreSchemaFactory } from "~/graphql/ApiCoreSchemaFactory.js";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";

export const ApiCoreFeature = createFeature({
    name: "ApiCore",
    register(container: Container, config: ApiCoreStorageOperations) {
        // Register features
        WcpFeature.register(container, config.wcpLicense ?? new NullLicense());
        MaskerFeature.register(container);
        AiFeature.register(container);
        LoggerFeature.register(container);
        EventPublisherFeature.register(container);
        BuildParamsFeature.register(container);
        EncryptionFeature.register(container);
        FeatureFlagsFeature.register(container);
        TenancyFeature.register(container, config.tenancyStorageOperations);
        SecurityFeature.register(container, config.securityStorageOperations);
        AdminUsersFeature.register(container, config.usersStorageOperations);
        KeyValueStoreFeature.register(container, config.keyValueStorageOperations);
        SystemFeature.register(container);
        IdpAuthenticatorFeature.register(container);
        container.register(NullWebhookDispatcher).inSingletonScope();
        WebhookProviderFeature.register(container);
        // Use registerInstance so ApiCoreContextEnhancer runs as the very first enhancer
        // (instance registrations precede class registrations in resolveAll). This ensures
        // ctx.security / ctx.tenancy / ctx.wcp are available to all subsequent enhancers.
        const coreEnhancer = container.resolveWithDependencies({
            implementation: ApiCoreContextEnhancerImpl,
            dependencies: [RequestContainer]
        });
        container.registerInstance(GraphQLContextEnhancer, coreEnhancer);
        container.register(ApiCoreSchemaFactory);
    }
});
