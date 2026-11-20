import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { ApiEndpoint } from "~/types/index.js";
import { NotAuthorizedError } from "~/utils/errors.js";

/**
 * Throws unless the current identity may use the given CMS endpoint (the `cms.endpoint.<type>`
 * permission).
 */
export const checkEndpointAccess = async (
    container: Container,
    endpointType: ApiEndpoint
): Promise<void> => {
    const permission = await container
        .resolve(IdentityContext)
        .getPermission(`cms.endpoint.${endpointType}`);
    if (!permission) {
        throw new NotAuthorizedError(`Not allowed to access "${endpointType}" endpoint.`);
    }
};
