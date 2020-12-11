import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { Context } from "@webiny/handler/types";

export default (context: Context<TenancyContext>) => {
    const { security } = context;
    if (!security.getTenant()) {
        throw new Error("Tenant missing.");
    }

    return `T#${security.getTenant().id}#I18N#`;
};
