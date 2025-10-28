import type { SecurityIdentity } from "@webiny/api-core/types/security.js";
import type { CmsIdentity } from "~/types/index.js";

export const getIdentity = <T extends SecurityIdentity | CmsIdentity | null>(
    input: T | null | undefined,
    defaultValue: T | null = null
): CmsIdentity | null => {
    const identity = input?.id && input?.displayName && input?.type ? input : defaultValue;
    if (!identity) {
        return null as T;
    }
    return {
        id: identity.id,
        displayName: identity.displayName,
        type: identity.type
    } as CmsIdentity;
};
