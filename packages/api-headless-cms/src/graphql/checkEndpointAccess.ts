import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { CmsContext } from "~/types/index.js";
import { NotAuthorizedError } from "~/utils/errors.js";

export const checkEndpointAccess = async (context: CmsContext): Promise<void> => {
    const permission = await context.container
        .resolve(IdentityContext)
        .getPermission(`cms.endpoint.${context.cms.type}`);
    if (!permission) {
        throw new NotAuthorizedError(`Not allowed to access "${context.cms.type}" endpoint.`);
    }
};
