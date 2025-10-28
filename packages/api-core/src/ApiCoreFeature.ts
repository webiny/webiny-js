import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di-container";
import { EventPublisherFeature } from "~/features/eventPublisher/feature.js";
import { SecurityFeature } from "~/features/security/SecurityFeature.js";
import { SystemFeature } from "~/features/system/SystemFeature.js";
import { TenancyFeature } from "./features/tenancy/TenancyFeature.js";
import { AdminUsersFeature } from "~/features/users/AdminUsersFeature.js";

import type { TenancyStorageOperations } from "~/types/tenancy.js";
import type { SecurityStorageOperations } from "~/types/security.js";
import type { AdminUsersStorageOperations } from "~/types/users.js";

export interface ApiCoreFeatureConfig {
    tenancyStorageOperations: TenancyStorageOperations;
    securityStorageOperations: SecurityStorageOperations;
    usersStorageOperations: AdminUsersStorageOperations;
}

export const ApiCoreFeature = createFeature({
    name: "ApiCore",
    register(container: Container, config: ApiCoreFeatureConfig) {
        EventPublisherFeature.register(container);
        TenancyFeature.register(container, config.tenancyStorageOperations);
        SecurityFeature.register(container, config.securityStorageOperations);
        AdminUsersFeature.register(container, config.usersStorageOperations);
        SystemFeature.register(container);
    }
});
