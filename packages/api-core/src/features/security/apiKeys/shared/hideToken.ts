import type { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { hasFullAccessOrNoAuthorization } from "~/features/security/utils/canGrantPermissions.js";
import type { ApiKey, ReadableApiKey } from "./types.js";

/**
 * Security: an API key's token grants all of the key's permissions (possibly full access), so it
 * is only returned to full access (or code running without authorization). Everyone else who may
 * read API keys gets them without the token. Returns copies, the given keys are not modified.
 */
export const hideTokenUnlessFullAccess = async (
    identityContext: IdentityContext.Interface,
    apiKeys: ApiKey[]
): Promise<ReadableApiKey[]> => {
    if (await hasFullAccessOrNoAuthorization(identityContext)) {
        return apiKeys;
    }
    return apiKeys.map(apiKey => ({ ...apiKey, token: null }));
};
