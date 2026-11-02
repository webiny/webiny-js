import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Actor } from "@webiny/api-workflows/domain/review/types.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

/** The default identity of `createCmsTestHandler`. */
export const ADMIN: IdentityData = { id: "id-12345678", type: "admin", displayName: "John Doe" };
export const REQUESTER: IdentityData = {
    id: "user-requester",
    type: "admin",
    displayName: "Rita Requester"
};
export const REVIEWER: IdentityData = {
    id: "user-reviewer",
    type: "admin",
    displayName: "Rob Reviewer"
};
export const OTHER_REVIEWER: IdentityData = {
    id: "user-other-reviewer",
    type: "admin",
    displayName: "Olga Reviewer"
};
export const READER: IdentityData = { id: "user-reader", type: "admin", displayName: "Rae Reader" };
export const WRITER: IdentityData = { id: "user-writer", type: "admin", displayName: "Wes Writer" };
export const REASSIGNER: IdentityData = {
    id: "user-reassigner",
    type: "admin",
    displayName: "Rhea Reassigner"
};
export const EDITOR: IdentityData = {
    id: "user-editor",
    type: "admin",
    displayName: "Eddie Editor"
};
export const NOBODY: IdentityData = {
    id: "user-nobody",
    type: "admin",
    displayName: "Nora Nobody"
};

/**
 * A request identity of type `api-key` with embedded permissions, as `TestAuthorizer` serves it.
 * Only for target-access unit tests; the wrapper tests use a real stored API key (R79).
 */
export const createApiKeyIdentity = (permissions: SecurityPermission[]): IdentityData => {
    return { id: "api-key-1", type: "api-key", displayName: "CI key", permissions };
};

/** The team of the test workflow's only step. */
export const REVIEW_TEAM = "team-1";

export const toActor = (identity: IdentityData): Actor => {
    return {
        type: "user",
        id: identity.id,
        displayName: identity.displayName,
        identityType: identity.type
    };
};
