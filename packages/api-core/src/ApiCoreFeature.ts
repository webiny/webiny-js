import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { EventPublisherFeature } from "~/features/eventPublisher/feature.js";
import { LoggerFeature } from "~/features/logger/feature.js";
import { SecurityFeature } from "~/features/security/SecurityFeature.js";
import { SystemFeature } from "~/features/system/SystemFeature.js";
import { TenancyFeature } from "./features/tenancy/TenancyFeature.js";
import { AdminUsersFeature } from "~/features/users/AdminUsersFeature.js";
import type { ApiCoreConfig } from "~/types/core.js";
import { ApiCoreStorageOperationsFactory } from "~/features/storageOperations/abstractions.js";
import { IdpAuthenticatorFeature } from "~/idp/feature.js";
import { KeyValueStoreFeature } from "~/features/keyValueStore/feature.js";
import { BuildParamsFeature } from "~/features/buildParams/feature.js";
import { EncryptionFeature } from "~/features/encryption/feature.js";
import { HasherFeature } from "~/features/hashing/feature.js";
import { FeatureFlagsFeature } from "~/features/featureFlags/feature.js";
import { MaskerFeature } from "~/features/masker/feature.js";
import { StringFormatterFeature } from "~/features/stringFormatter/feature.js";
import { DateFormatterFeature } from "~/features/dateFormatter/feature.js";
import { AiFeature } from "~/features/ai/feature.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { NullWebhookDispatcher } from "./features/webhooks/WebhookDispatcher/NullWebhookDispatcher.js";
import { WebhookProviderFeature } from "~/features/webhooks/index.js";
import { RequestContextFeature } from "~/features/requestContext/index.js";
import { ApiCoreSchemaFactory } from "~/graphql/ApiCoreSchemaFactory.js";
import { SecuritySchemaFactory } from "~/graphql/security/SecuritySchemaFactory.js";
import { UsersSchemaFactory } from "~/graphql/users/UsersSchemaFactory.js";
import { SystemSchemaFactory } from "~/graphql/system/SystemSchemaFactory.js";
import { WcpSchemaFactory } from "~/graphql/wcp/WcpSchemaFactory.js";

export const ApiCoreFeature = createFeature({
    name: "ApiCore",
    register(container: Container, config: ApiCoreConfig = {}) {
        // Storage operations are built synchronously, here, from the adapter-provided factory —
        // the same way for every event (no out-of-feature construction, no async initializer).
        const storageOperations = container.resolve(ApiCoreStorageOperationsFactory).create();

        // Register features
        WcpFeature.register(container, config.wcpLicense);
        MaskerFeature.register(container);
        StringFormatterFeature.register(container);
        DateFormatterFeature.register(container);
        AiFeature.register(container);
        LoggerFeature.register(container);
        EventPublisherFeature.register(container);
        BuildParamsFeature.register(container);
        EncryptionFeature.register(container);
        HasherFeature.register(container);
        FeatureFlagsFeature.register(container);
        TenancyFeature.register(container, storageOperations.tenancyStorageOperations);
        SecurityFeature.register(container, storageOperations.securityStorageOperations);
        AdminUsersFeature.register(container, storageOperations.usersStorageOperations);
        KeyValueStoreFeature.register(container, storageOperations.keyValueStorageOperations);
        SystemFeature.register(container);
        IdpAuthenticatorFeature.register(container);
        RequestContextFeature.register(container);
        container.register(NullWebhookDispatcher).inSingletonScope();
        WebhookProviderFeature.register(container);

        // Core API GraphQL schema: a base factory (root types + scalars) plus one
        // CoreGraphQLSchemaFactory per domain.
        container.register(ApiCoreSchemaFactory);
        container.register(SecuritySchemaFactory);
        container.register(UsersSchemaFactory);
        container.register(SystemSchemaFactory);
        container.register(WcpSchemaFactory);
    }
});
