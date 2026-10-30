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
const WITH_REASSIGN_ONE = "Wait for it to finish, or open it and cancel it. Then try again.";
const WITHOUT_REASSIGN =
    "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again.";
const WITHOUT_REASSIGN_ONE =
    "Wait for it to finish, or ask someone with Reassign and operate to cancel it. Then try again.";

// QBZ-19: only Close remains; the body carries the count and what to do about it.
export const blockedDeleteDialog = (params: BlockedDeleteDialogParams): WorkflowEditorDialogVm => {
    const single = params.count === 1;
    let count = `${params.count} reviews using “${params.workflowName}” are in progress.`;
    let advice = params.canReassign ? WITH_REASSIGN : WITHOUT_REASSIGN;
    if (single) {
        count = `1 review using “${params.workflowName}” is in progress.`;
        advice = params.canReassign ? WITH_REASSIGN_ONE : WITHOUT_REASSIGN_ONE;
    }

    return {
        kind: "blockedDelete",
        icon: "block",
        title: "This workflow can't be deleted yet",
        body: `${count} ${advice}`,
        note: null,
        reviews: params.reviews,
        confirmLabel: null,
        cancelLabel: "Close",
        destructive: false,
        cancelDestructive: false,
        busy: false
    };
};
