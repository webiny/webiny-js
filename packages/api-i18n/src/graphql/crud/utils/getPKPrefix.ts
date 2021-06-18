import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context } from "@webiny/handler/types";

export default (context: Context<TenancyContext>) => {
    const { tenancy } = context;
    if (!tenancy.getCurrentTenant()) {
        throw new Error("Tenant missing.");
    }

    return `T#${tenancy.getCurrentTenant().id}#I18N#`;
};
