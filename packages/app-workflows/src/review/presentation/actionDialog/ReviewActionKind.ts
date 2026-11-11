// The step actions that open a confirmation dialog.
export type ReviewActionKind =
    | "start"
    | "takeOver"
    | "reassign"
    | "approve"
    | "reject"
    | "cancel"
    | "restart";
