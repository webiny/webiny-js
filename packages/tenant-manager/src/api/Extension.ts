import { createFeature } from "@webiny/feature/api";
import TenantModel from "./domain/TenantModel.js";
import { CreateAndInstallTenantFeature } from "./features/CreateAndInstallTenant/feature.js";
import { GetTenantByIdFeature } from "./features/GetTenantById/feature.js";
import { GetCurrentTenantFeature } from "./features/GetCurrentTenant/feature.js";
import { UpdateTenantFeature } from "./features/UpdateTenant/feature.js";
import InstallTenantSchema from "./graphql/InstallTenantSchema.js";
import GetCurrentTenantSchema from "./graphql/GetCurrentTenantSchema.js";
import { AddCmsPermissionsFeature } from "~/api/features/AddCmsPermissions/feature.js";

export const Extension = createFeature({
    name: "TenantManagement",
    register(container) {
        container.register(TenantModel);

        //GraphQL
        container.register(InstallTenantSchema);
        container.register(GetCurrentTenantSchema);

        // Features
        CreateAndInstallTenantFeature.register(container);
        GetTenantByIdFeature.register(container);
        GetCurrentTenantFeature.register(container);
        UpdateTenantFeature.register(container);
        AddCmsPermissionsFeature.register(container);
    }
});
