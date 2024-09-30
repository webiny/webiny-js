import { NotAuthorizedError } from "@webiny/api-security";
import { Context } from "~/types";

export const checkPermissions = async (context: Pick<Context, "security">): Promise<void> => {
    try {
        const permission = await context.security.getPermission("*");

        if (permission) {
            return;
        }
    } catch (ex) {
        console.log("Error while checking CMS Export / Import  permissions.");
        console.error(ex);
    }
    throw new NotAuthorizedError();
};
