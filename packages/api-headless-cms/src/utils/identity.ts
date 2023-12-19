import { SecurityIdentity } from "@webiny/api-security/types";

export const getIdentity = <T extends SecurityIdentity | null>(
    input: SecurityIdentity | null | undefined,
    defaultValue: T | null = null
): T => {
    const identity = input?.id && input?.displayName && input?.type ? input : defaultValue;
    if (!identity) {
        return null as T;
    }
    return {
        id: identity.id,
        displayName: identity.displayName,
        type: identity.type
    } as T;
};
