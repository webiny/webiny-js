import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { ExclusionUserName } from "./ExclusionsSource.js";
import { DELETED_USER_LABEL } from "./exclusionUserCopy.js";

/*
 * The known names plus one `listUsers({ ids })` answer (R321, D117): a returned user is found
 * with its display name, an id in `missingIds` is `Deleted user`. Returns a new map.
 */
export const mergeUserNames = (
    known: ReadonlyMap<string, ExclusionUserName>,
    result: WorkflowUserList
): Map<string, ExclusionUserName> => {
    const names = new Map(known);
    for (const user of result.users) {
        names.set(user.id, { userId: user.id, label: user.displayName, state: "found" });
    }
    for (const userId of result.missingIds) {
        names.set(userId, { userId, label: DELETED_USER_LABEL, state: "deleted" });
    }
    return names;
};
