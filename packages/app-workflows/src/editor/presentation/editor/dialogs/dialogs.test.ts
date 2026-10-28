import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { discardChangesDialog } from "./discardChangesDialog.js";

describe("discardChangesDialog (R279, QBZ-17)", () => {
    it("names the workflow", () => {
        expect(discardChangesDialog("Article review")).toEqual({
            kind: "discardChanges",
            icon: "warning",
            title: "Discard unsaved changes?",
            body: "You have unsaved changes to “Article review”. If you leave this workflow now, they are lost.",
            note: null,
            reviews: [],
            confirmLabel: "Discard changes",
            cancelLabel: "Keep editing",
            destructive: true,
            cancelDestructive: false,
            busy: false
        });
    });

    it("says this workflow when the workflow has no name", () => {
        expect(discardChangesDialog("").body).toBe(
            "You have unsaved changes to “this workflow”. If you leave this workflow now, they are lost."
        );
        expect(discardChangesDialog("  ").body).toContain("“this workflow”");
    });
});
