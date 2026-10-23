import type { WorkflowEditorDialogKind } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorDialogVm } from "~/editor/presentation/editor/abstractions.js";

const DIALOGS: Record<WorkflowEditorDialogKind, WorkflowEditorDialogVm> = {
    discardChanges: {
        kind: "discardChanges",
        title: "Discard unsaved changes?",
        body: "You have unsaved changes to “Article review”. If you leave this workflow now, they are lost.",
        note: null,
        reviews: [],
        confirmLabel: "Discard changes",
        cancelLabel: "Keep editing",
        destructive: true,
        cancelDestructive: false,
        busy: false
    },
    conflict: {
        kind: "conflict",
        title: "Someone else changed this workflow",
        body: "Ivan Horvat saved a newer version of “Article review” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.",
        note: null,
        reviews: [],
        confirmLabel: "Reload workflow",
        cancelLabel: "Keep editing",
        destructive: false,
        cancelDestructive: false,
        busy: false
    },
    deleted: {
        kind: "deleted",
        title: "This workflow was deleted",
        body: "“Article review” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for Article, or discard them.",
        note: null,
        reviews: [],
        confirmLabel: "Save as new workflow",
        cancelLabel: "Discard changes",
        destructive: false,
        cancelDestructive: true,
        busy: false
    },
    deleteWorkflow: {
        kind: "deleteWorkflow",
        title: "Delete workflow?",
        body: "“Article review” will be removed from Article. New revisions can then be published without a review. Finished reviews keep their history.",
        note: null,
        reviews: [],
        confirmLabel: "Delete workflow",
        cancelLabel: "Cancel",
        destructive: true,
        cancelDestructive: false,
        busy: false
    },
    blockedDelete: {
        kind: "blockedDelete",
        title: "This workflow can't be deleted yet",
        body: "2 reviews using “Article review” are in progress.",
        note: "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again.",
        reviews: [
            {
                reviewId: "review-1",
                title: "Spring campaign",
                position: "Step 2 of 3 · Legal sign-off",
                url: "/cms/content-entries/article?id=entry-1%230001"
            },
            {
                reviewId: "review-2",
                title: "Summer sale",
                position: "Step 1 of 3 · Editorial check",
                url: "/cms/content-entries/article?id=entry-2%230001"
            }
        ],
        confirmLabel: null,
        cancelLabel: "Close",
        destructive: false,
        cancelDestructive: false,
        busy: false
    },
    deleteStep: {
        kind: "deleteStep",
        title: "Delete step?",
        body: "“Legal sign-off” is removed from this workflow when you save. Reviews already running are not affected.",
        note: null,
        reviews: [],
        confirmLabel: "Delete step",
        cancelLabel: "Cancel",
        destructive: true,
        cancelDestructive: false,
        busy: false
    },
    reloadWorkflow: {
        kind: "reloadWorkflow",
        title: "Reload workflow?",
        body: "Your unsaved draft for Article is lost, and the existing workflow “Article approval” opens.",
        note: null,
        reviews: [],
        confirmLabel: "Reload",
        cancelLabel: "Keep editing",
        destructive: true,
        cancelDestructive: false,
        busy: false
    }
};

// The dialog of a kind with the design's copy; `overrides` changes single fields.
export const createDialogVm = (
    kind: WorkflowEditorDialogKind,
    overrides: Partial<WorkflowEditorDialogVm> = {}
): WorkflowEditorDialogVm => {
    return { ...DIALOGS[kind], ...overrides };
};
