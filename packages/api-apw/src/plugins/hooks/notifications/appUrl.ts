import { ApwContext } from "~/types";

export const getAppUrl = async (context: ApwContext) => {
    const tenant = context.tenancy.getCurrentTenant().id;
    try {
        return await context.settings.getSettings(tenant);
    } catch (ex) {
        if (ex.code !== "NOT_FOUND") {
            throw ex;
        }
    }
    return null;
};
