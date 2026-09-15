import { createFeature } from "@webiny/feature/api";
import { FrontendPermissionsFeature } from "./features/permissions/feature.js";
import { FrontendStarterKitsFeature } from "./features/starterKits/feature.js";
import { FrontendGetSettingsFeature } from "./features/getSettings/feature.js";
import { FrontendUpdateSettingsFeature } from "./features/updateSettings/feature.js";
import { FrontendSettingsSchema } from "./graphql/FrontendSettingsSchema.js";

export const Extension = createFeature({
    name: "FrontendSettings",
    register(container) {
        FrontendPermissionsFeature.register(container);
        FrontendStarterKitsFeature.register(container);
        FrontendGetSettingsFeature.register(container);
        FrontendUpdateSettingsFeature.register(container);

        container.register(FrontendSettingsSchema);
    }
});
