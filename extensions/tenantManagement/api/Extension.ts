import { createFeature } from "webiny/api";
import CompanyModel from "./features/CompanyModel.js";
import { InstallTenantUseCase } from "webiny/api/tenancy";
import { GraphQLSchemaFactory } from "webiny/api/graphql";

// Old
import { installTenant } from "./graphql/installTenant";
import { getCurrentCompany } from "./graphql/getCurrentCompany";

export const createExtension = () => {
    return [installTenant(), getCurrentCompany()];
};

export default createFeature({
    name: "TenantManagement",
    register(container) {
        container.register(CompanyModel);
    }
});
