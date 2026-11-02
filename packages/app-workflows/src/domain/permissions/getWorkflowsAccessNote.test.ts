import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import { getWorkflowsAccessNote } from "./getWorkflowsAccessNote.js";
import { WORKFLOWS_ACCESS_COPY } from "./workflowsAccessCopy.js";

const createAccess = (overrides: Partial<WorkflowsAccess>): WorkflowsAccess => {
    return { level: "custom", editor: false, reassign: false, locked: false, ...overrides };
};

describe("getWorkflowsAccessNote (R333, QBZ-77)", () => {
    it("explains No access", () => {
        const access = createAccess({ level: "none" });

        expect(getWorkflowsAccessNote(access)).toBe(
            "Can't build workflows or operate reviews. Can still review content as a member of a reviewing team."
        );
    });

    it("explains Full access, also when it is locked by *", () => {
        const full = createAccess({ level: "full" });
        const locked = createAccess({ level: "full", locked: true });

        expect(getWorkflowsAccessNote(full)).toBe(
            "Includes Manage workflows and Reassign and operate."
        );
        expect(getWorkflowsAccessNote(locked)).toBe(
            "Includes Manage workflows and Reassign and operate."
        );
    });

    it("explains Custom with nothing ticked", () => {
        const access = createAccess({});

        expect(getWorkflowsAccessNote(access)).toBe(
            "With nothing selected, this role has the same access as No access."
        );
    });

    it("explains Custom with both ticked", () => {
        const access = createAccess({ editor: true, reassign: true });

        expect(getWorkflowsAccessNote(access)).toBe(
            "Same as Full access today. Full access also gets workflow permissions added in later versions; Custom doesn't."
        );
    });

    it("has no note for Custom with one box ticked", () => {
        const editor = createAccess({ editor: true });
        const reassign = createAccess({ reassign: true });

        expect(getWorkflowsAccessNote(editor)).toBeNull();
        expect(getWorkflowsAccessNote(reassign)).toBeNull();
    });

    it("keeps the group copy verbatim (R333, Copy gap 1)", () => {
        expect(WORKFLOWS_ACCESS_COPY).toEqual({
            title: "Workflows",
            description: "Publishing workflows for Headless CMS and Website Builder",
            levelLabel: "Access level",
            noAccess: "No access",
            fullAccess: "Full access",
            custom: "Custom",
            editorLabel: "Manage workflows",
            editorDescription:
                "Create and edit workflows, manage reviewer exclusions, and use routing tools such as Test routing.",
            reassignLabel: "Reassign and operate",
            reassignDescription:
                "Reassign reviewers, restart failed automated steps, and cancel reviews requested by others.",
            noAccessNote:
                "Can't build workflows or operate reviews. Can still review content as a member of a reviewing team.",
            fullAccessNote: "Includes Manage workflows and Reassign and operate.",
            customNoneNote: "With nothing selected, this role has the same access as No access.",
            customBothNote:
                "Same as Full access today. Full access also gets workflow permissions added in later versions; Custom doesn't.",
            reviewingNote:
                "Reviewing is not a permission. Anyone in a step's reviewing teams who can read the content can review it."
        });
    });
});
