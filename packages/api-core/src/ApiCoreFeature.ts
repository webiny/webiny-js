import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { EventPublisherFeature } from "~/features/eventPublisher/feature.js";
import { SecurityFeature } from "~/features/security/SecurityFeature.js";
import { SystemFeature } from "~/features/system/SystemFeature.js";
import {
    TenantRegistryFeature,
    TenantScopeTenancyFeature
} from "./features/tenancy/TenancyFeature.js";
import { AdminUsersFeature } from "~/features/users/AdminUsersFeature.js";
import type { ApiCoreConfig } from "~/types/core.js";
import { ApiCoreStorageOperationsFactory } from "~/features/storageOperations/abstractions.js";
import { IdpAuthenticatorFeature } from "~/idp/feature.js";
import { KeyValueStoreFeature } from "~/features/keyValueStore/feature.js";
import { BuildParamsFeature } from "~/features/buildParams/feature.js";
import { PublicUrlsFeature } from "~/features/publicUrls/feature.js";
import { CdnCacheFeature } from "~/features/cdnCache/feature.js";
import { DebuggerFeature } from "~/features/debugger/feature.js";
import { EncryptionFeature } from "~/features/encryption/feature.js";
import { HasherFeature } from "~/features/hashing/feature.js";
import { FeatureFlagsFeature } from "~/features/featureFlags/feature.js";
import { MaskerFeature } from "~/features/masker/feature.js";
import { StringFormatterFeature } from "~/features/stringFormatter/feature.js";
import { DateFormatterFeature } from "~/features/dateFormatter/feature.js";
import { AiFeature } from "~/features/ai/feature.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { HttpClientFeature } from "~/features/httpClient/feature.js";
import { NullWebhookDispatcher } from "./features/webhooks/WebhookDispatcher/NullWebhookDispatcher.js";
import { NullSendToIdentityUseCase } from "~/features/websockets/index.js";
import { NotifyRecordChangeFeature } from "~/features/websockets/index.js";
import { WebhookProviderFeature } from "~/features/webhooks/index.js";
import {
    TenantNeutralRequestContextFeature,
    TenantScopeRequestContextFeature
} from "~/features/requestContext/index.js";
import { RequestContainer } from "@webiny/api-kernel-core";
import { SingleContainerTenantScopes } from "~/features/tenancy/TenantScopes/SingleContainerTenantScopes.js";
import { ApiCoreSchemaFactory } from "~/graphql/ApiCoreSchemaFactory.js";
import { SecuritySchemaFactory } from "~/graphql/security/SecuritySchemaFactory.js";
import { UsersSchemaFactory } from "~/graphql/users/UsersSchemaFactory.js";
import { SystemSchemaFactory } from "~/graphql/system/SystemSchemaFactory.js";
import { WcpSchemaFactory } from "~/graphql/wcp/WcpSchemaFactory.js";
import { FeatureFlagsSchemaFactory } from "~/graphql/featureFlags/FeatureFlagsSchemaFactory.js";

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
        HttpClientFeature.register(container);
        AiFeature.register(container);
        EventPublisherFeature.register(container);
        BuildParamsFeature.register(container);
        PublicUrlsFeature.register(container);
        CdnCacheFeature.register(container);
        DebuggerFeature.register(container);
        EncryptionFeature.register(container);
        HasherFeature.register(container);
        FeatureFlagsFeature.register(container);
        /*
         * In a tenant scope, the tenant registry, the raw request values and `TenantScopes` come
         * from the request container (`TenantNeutralRequestFeature`), shared by every scope of the
         * request. A container that holds the whole API (a test harness without tenant scopes) has
         * its own, and its `TenantScopes` serves only the container's own tenant.
         */
        if (!config.tenantScope) {
            TenantRegistryFeature.register(container, storageOperations.tenancyStorageOperations);
            TenantNeutralRequestContextFeature.register(container);
            container.registerInstance(RequestContainer, container);
            container.register(SingleContainerTenantScopes).inSingletonScope();
        }
        TenantScopeTenancyFeature.register(container);
        SecurityFeature.register(container, storageOperations.securityStorageOperations);
        AdminUsersFeature.register(container, storageOperations.usersStorageOperations);
        KeyValueStoreFeature.register(container, storageOperations.keyValueStorageOperations);
        SystemFeature.register(container);
        IdpAuthenticatorFeature.register(container);
        TenantScopeRequestContextFeature.register(container);
        container.register(NullWebhookDispatcher).inSingletonScope();
        container.register(NullSendToIdentityUseCase);
        NotifyRecordChangeFeature.register(container);
        WebhookProviderFeature.register(container);

        // Core API GraphQL schema: a base factory (root types + scalars) plus one
        // CoreGraphQLSchemaFactory per domain.
        container.register(ApiCoreSchemaFactory);
        container.register(SecuritySchemaFactory);
        container.register(UsersSchemaFactory);
        container.register(SystemSchemaFactory);
        container.register(WcpSchemaFactory);
        container.register(FeatureFlagsSchemaFactory);
    }
});
