import type { DialogReviewVm } from "../abstractions.js";
import type { WorkflowEditorDialogVm } from "../abstractions.js";

export interface BlockedDeleteDialogParams {
    workflowName: string;
    // The exact number of reviews in progress, which may exceed the listed ones.
    count: number;
    reviews: DialogReviewVm[];
    // Whether the viewer has the workflows `reassign` permission (QBZ-19).
    canReassign: boolean;
}

const WITH_REASSIGN = "Wait for them to finish, or open each one and cancel it. Then try again.";
const WITHOUT_REASSIGN =
    "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again.";

// QBZ-19: only Close remains.
export const blockedDeleteDialog = (params: BlockedDeleteDialogParams): WorkflowEditorDialogVm => {
    const body =
        params.count === 1
            ? `1 review using “${params.workflowName}” is in progress.`
            : `${params.count} reviews using “${params.workflowName}” are in progress.`;

    return {
        kind: "blockedDelete",
        title: "This workflow can't be deleted yet",
        body,
        note: params.canReassign ? WITH_REASSIGN : WITHOUT_REASSIGN,
        reviews: params.reviews,
        confirmLabel: null,
        cancelLabel: "Close",
        destructive: false,
        cancelDestructive: false,
        busy: false
    };
};
