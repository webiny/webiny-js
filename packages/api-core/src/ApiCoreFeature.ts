import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { SettingsDomain } from "~/domain/settings/index.js";
import { EventPublisherFeature } from "~/features/eventPublisher/feature.js";
import { LoggerFeature } from "~/features/logger/feature.js";
import { SecurityFeature } from "~/features/security/SecurityFeature.js";
import { SystemFeature } from "~/features/system/SystemFeature.js";
import { TenancyFeature } from "./features/tenancy/TenancyFeature.js";
import { AdminUsersFeature } from "~/features/users/AdminUsersFeature.js";
import { SettingsFeature } from "~/features/settings/index.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";

export const ApiCoreFeature = createFeature({
    name: "ApiCore",
    register(container: Container, config: ApiCoreStorageOperations) {
        // Register domain models
        SettingsDomain.register(container);

        // Register features
        LoggerFeature.register(container);
        EventPublisherFeature.register(container);
        TenancyFeature.register(container, config.tenancyStorageOperations);
        SecurityFeature.register(container, config.securityStorageOperations);
        AdminUsersFeature.register(container, config.usersStorageOperations);
        SettingsFeature.register(container, config.settingsStorageOperations);
        SystemFeature.register(container);
    }
});
