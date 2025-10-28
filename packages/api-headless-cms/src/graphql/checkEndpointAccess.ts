import type { CmsContext } from "~/types/index.js";
import { NotAuthorizedError } from "~/utils/errors.js";

export const checkEndpointAccess = async (context: CmsContext): Promise<void> => {
    const permission = await context.security.getPermission(`cms.endpoint.${context.cms.type}`);
    if (!permission) {
        throw new NotAuthorizedError(`Not allowed to access "${context.cms.type}" endpoint.`);
    }
};
