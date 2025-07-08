import type { IStorerAfterEachPluginCanHandleParams } from "~/resolver/plugins/StorerAfterEachPlugin.js";

export const shouldBeHandled = (params: IStorerAfterEachPluginCanHandleParams): boolean => {
    const { item, table, source, target } = params;
    if (table.type !== "regular") {
        return false;
    } else if (item.PK.includes("#ADMIN_USER#") === false) {
        return false;
    } else if (item.SK !== "A") {
        return false;
    } else if (item.TYPE !== "adminUsers.user") {
        return false;
    } else if (!source.services.cognitoUserPoolId || !target.services.cognitoUserPoolId) {
        return false;
    }
    /**
     * TODO verify that email is always present in Cognito users.
     */
    // @ts-expect-error
    else if (!item.data?.email) {
        return false;
    }
    return true;
};
