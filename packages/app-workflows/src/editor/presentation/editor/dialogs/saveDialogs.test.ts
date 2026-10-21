import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { blockedDeleteDialog } from "./blockedDeleteDialog.js";
import { conflictDialog } from "./conflictDialog.js";
import { deleteWorkflowDialog } from "./deleteWorkflowDialog.js";
import { deletedDialog } from "./deletedDialog.js";
import { reloadWorkflowDialog } from "./reloadWorkflowDialog.js";

describe("conflictDialog (D131)", () => {
    it("names who saved and which workflow", () => {
        expect(
            conflictDialog({ savedByName: "Grace Hopper", workflowName: "Article review" })
        ).toEqual({
            kind: "conflict",
            title: "Someone else changed this workflow",
            body: "Grace Hopper saved a newer version of “Article review” while you were editing, so your changes were not saved. Reload to get the latest version. Reloading discards your unsaved changes.",
            note: null,
            reviews: [],
            confirmLabel: "Reload workflow",
            cancelLabel: "Keep editing",
            destructive: false,
            cancelDestructive: false,
            busy: false
        });
    });

    it("says this workflow for an unnamed workflow", () => {
        expect(conflictDialog({ savedByName: "Someone", workflowName: " " }).body).toContain(
            "Someone saved a newer version of “this workflow” while"
        );
    });
});

describe("deletedDialog (QBZ-94)", () => {
    it("offers to save as new or discard", () => {
        expect(deletedDialog({ workflowName: "Article review", modelName: "Article" })).toEqual({
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
        });
    });
});

describe("deleteWorkflowDialog (QBZ-19)", () => {
    it("names the workflow and the model", () => {
        expect(
            deleteWorkflowDialog({ workflowName: "Article review", modelName: "Article" })
        ).toEqual({
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
        });
    });
});

describe("blockedDeleteDialog (QBZ-19)", () => {
    const reviews = [
        {
            reviewId: "r1",
            title: "Spring campaign",
            position: "Step 2 of 3 · Legal sign-off",
            url: "/a"
        }
    ];

    it("counts in the singular and offers Close only", () => {
        const dialog = blockedDeleteDialog({
            workflowName: "Article review",
            count: 1,
            reviews,
            canReassign: true
        });

        expect(dialog).toEqual({
            kind: "blockedDelete",
            title: "This workflow can't be deleted yet",
            body: "1 review using “Article review” is in progress.",
            note: "Wait for them to finish, or open each one and cancel it. Then try again.",
            reviews,
            confirmLabel: null,
            cancelLabel: "Close",
            destructive: false,
            cancelDestructive: false,
            busy: false
        });
    });

    it("counts in the plural and sends a viewer without reassign to someone who has it", () => {
        const dialog = blockedDeleteDialog({
            workflowName: "Article review",
            count: 7,
            reviews,
            canReassign: false
        });

        expect(dialog.body).toBe("7 reviews using “Article review” are in progress.");
        expect(dialog.note).toBe(
            "Wait for them to finish, or ask someone with Reassign and operate to cancel them. Then try again."
        );
    });
});

describe("reloadWorkflowDialog (QBZ-18)", () => {
    it("names the model and the existing workflow", () => {
        expect(
            reloadWorkflowDialog({ modelName: "Article", workflowName: "Article approval" })
        ).toEqual({
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
        });
    });
});
