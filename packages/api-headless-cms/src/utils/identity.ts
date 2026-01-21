import type { SecurityIdentity } from "@webiny/api-core/types/security.js";
import type { CmsIdentity } from "~/types/index.js";

type IdentityLike = Pick<CmsIdentity, "id" | "displayName" | "type">;

// input guaranteed → never null
export function getIdentity(input: SecurityIdentity | CmsIdentity): IdentityLike;

// input nullable, default provided → never null
export function getIdentity(
    input: SecurityIdentity | CmsIdentity | null | undefined,
    defaultValue: SecurityIdentity | CmsIdentity
): IdentityLike;

// input nullable, default nullable/omitted → may return null
export function getIdentity(
    input: SecurityIdentity | CmsIdentity | null | undefined,
    defaultValue?: SecurityIdentity | CmsIdentity | null
): IdentityLike | null;

export function getIdentity(
    input: SecurityIdentity | CmsIdentity | null | undefined,
    defaultValue?: SecurityIdentity | CmsIdentity | null
): IdentityLike | null {
    const identity = input?.id && input?.displayName && input?.type ? input : defaultValue;

    if (!identity) {
        return null;
    }

    return {
        id: identity.id,
        displayName: identity.displayName,
        type: identity.type
    };
}
