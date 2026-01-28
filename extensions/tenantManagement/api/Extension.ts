import { createFeature } from "webiny/api";
import TenantModel from "./domain/TenantModel.js";
import { CreateAndInstallTenantFeature } from "./features/CreateAndInstallTenant/feature.js";
import { GetTenantByIdFeature } from "./features/GetTenantById/feature.js";
import { GetCurrentTenantFeature } from "./features/GetCurrentTenant/feature.js";
import { UpdateTenantFeature } from "./features/UpdateTenant/feature.js";

// Old
// import { installTenant } from "./graphql/installTenant";
// import { getCurrentTenant } from "./graphql/getCurrentTenant";

export default createFeature({
    name: "TenantManagement",
    register(container) {
        container.register(TenantModel);
        CreateAndInstallTenantFeature.register(container);
        GetTenantByIdFeature.register(container);
        GetCurrentTenantFeature.register(container);
        UpdateTenantFeature.register(container);
    }
});
