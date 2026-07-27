import type { ICollabIdentity } from "~/domain/thread/abstractions.js";

/**
 * The subset of a Webiny identity (request identity or CMS identity) we project from.
 */
export interface WebinyIdentityLike {
    id: string;
    displayName: string;
    type: string;
}

/**
 * Projects any Webiny identity (request identity or CMS identity) to the stored shape.
 */
export const toCollabIdentity = (identity: WebinyIdentityLike): ICollabIdentity => {
    return {
        id: identity.id,
        displayName: identity.displayName,
        type: identity.type
    };
};
