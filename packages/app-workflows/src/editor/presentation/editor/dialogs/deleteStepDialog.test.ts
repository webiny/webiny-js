import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { deleteStepDialog } from "./deleteStepDialog.js";

describe("deleteStepDialog (QBZ-12 prototype copy)", () => {
    it("names the step", () => {
        expect(deleteStepDialog("Legal sign-off")).toEqual({
            kind: "deleteStep",
            icon: "delete",
            title: "Delete step?",
            body: "“Legal sign-off” is removed from this workflow when you save. Reviews already running are not affected.",
            note: null,
            reviews: [],
            confirmLabel: "Delete step",
            cancelLabel: "Cancel",
            destructive: true,
            cancelDestructive: false,
            busy: false
        });
    });

    it("says Untitled step for a step with no title", () => {
        expect(deleteStepDialog("").body).toBe(
            "“Untitled step” is removed from this workflow when you save. Reviews already running are not affected."
        );
    });
});
