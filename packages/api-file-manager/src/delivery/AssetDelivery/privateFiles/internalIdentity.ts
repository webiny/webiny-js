import { SecurityIdentity } from "@webiny/api-security/types";

/**
 * This identity is used to bypass the current behavior of FLP. Even when using `withoutAuthorization`,
 * FLP will complain, if the identity is `undefined`. Using this mock identity and `security.withIdentity`,
 * we set this temporary identity for the duration of the callback execution, and FLP is happy.
 */
export const internalIdentity: SecurityIdentity = {
    id: "asset-delivery",
    type: "asset-delivery",
    displayName: ""
};
