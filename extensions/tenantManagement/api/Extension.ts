import { createFeature } from "webiny/api";
import CompanyModel from "./domain/CompanyModel.js";
import { CreateAndInstallTenantFeature } from "./features/CreateAndInstallTenant/feature.js";
import { GetCompanyByIdFeature } from "./features/GetCompanyById/feature.js";
import { GetCurrentCompanyFeature } from "./features/GetCurrentCompany/feature.js";
import { UpdateCompanyFeature } from "./features/UpdateCompany/feature.js";

// Old
// import { installTenant } from "./graphql/installTenant";
// import { getCurrentCompany } from "./graphql/getCurrentCompany";

export default createFeature({
    name: "TenantManagement",
    register(container) {
        container.register(CompanyModel);
        CreateAndInstallTenantFeature.register(container);
        GetCompanyByIdFeature.register(container);
        GetCurrentCompanyFeature.register(container);
        UpdateCompanyFeature.register(container);
    }
});
