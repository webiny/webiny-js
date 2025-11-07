import type { Context } from "~/types.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";

export interface ICheckPermissionFactoryParams {
    getContext(): Pick<Context, "security">;
}

export const checkPermissionFactory = (params: ICheckPermissionFactoryParams) => {
    return async () => {
        const context = params.getContext();
        if (!context.security) {
            throw new Error("Missing security context.");
        }
        const permission = await context.security.getPermission("logs");
        if (permission) {
            return;
        }
        throw new NotAuthorizedError();
    };
};
