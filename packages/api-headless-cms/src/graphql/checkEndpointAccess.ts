import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { CmsContext } from "~/types/index.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { HeadlessCmsEnhancerConfig } from "~/HeadlessCmsInitializer.js";

export const checkEndpointAccess = async (context: CmsContext): Promise<void> => {
    const endpointType = context.container.resolve(HeadlessCmsEnhancerConfig).type;
    const permission = await context.container
        .resolve(IdentityContext)
        .getPermission(`cms.endpoint.${endpointType}`);
    if (!permission) {
        throw new NotAuthorizedError(`Not allowed to access "${endpointType}" endpoint.`);
    }
};
