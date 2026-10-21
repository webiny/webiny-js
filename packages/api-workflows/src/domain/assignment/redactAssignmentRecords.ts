import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import type { AssignmentRecord } from "./types.js";

/**
 * The assignment entries one viewer may see (spec 8, D89, D127, R96). Pure. `editor` and
 * `reassign` (full access sets both) see every record; everyone else sees only the outcomes,
 * because a skip names a person and why they were passed over. Order is kept.
 */
export const redactAssignmentRecords = (
    records: AssignmentRecord[],
    permissions: WorkflowsPermissionSet
): AssignmentRecord[] => {
    if (permissions.editor || permissions.reassign) {
        return [...records];
    }
    return records.filter(record => record.kind !== "skip");
};
