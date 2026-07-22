import type { ICollabIdentity } from "~/domain/thread/abstractions.js";

/**
 * Projects any Webiny identity (request identity or CMS identity) to the stored shape.
 */
export const toCollabIdentity = (identity: {
    id: string;
    displayName: string;
    type: string;
}): ICollabIdentity => {
    return {
        id: identity.id,
        displayName: identity.displayName,
        type: identity.type
    };
};
