import type { TestRoutingContext } from "./TestRoutingContext.js";

const DELETED_USER = "Deleted user";

/*
 * A user's name for the Test routing prose: the looked-up name, then the label of the reference
 * maps, then `Deleted user` (R301). Never throws.
 */
export const getInspectionUserName = (userId: string, context: TestRoutingContext): string => {
    const looked = context.names.users.get(userId);
    if (looked !== undefined) {
        return looked;
    }
    const reference = context.references.users.get(userId);
    if (reference !== undefined) {
        return reference.label;
    }
    return DELETED_USER;
};
