import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import { changeWorkflowsAccessLevel } from "./changeWorkflowsAccessLevel.js";

const NONE: WorkflowsAccess = { level: "none", editor: false, reassign: false, locked: false };
const FULL: WorkflowsAccess = { level: "full", editor: false, reassign: false, locked: false };
const LOCKED: WorkflowsAccess = { level: "full", editor: false, reassign: false, locked: true };
const CUSTOM_EDITOR: WorkflowsAccess = {
    level: "custom",
    editor: true,
    reassign: false,
    locked: false
};

describe("changeWorkflowsAccessLevel (R333)", () => {
    it("starts Custom from No access with nothing ticked", () => {
        const access = changeWorkflowsAccessLevel(NONE, "custom");

        expect(access).toEqual({ level: "custom", editor: false, reassign: false, locked: false });
    });

    it("starts Custom from Full with both ticked (the same access until narrowed)", () => {
        const access = changeWorkflowsAccessLevel(FULL, "custom");

        expect(access).toEqual({ level: "custom", editor: true, reassign: true, locked: false });
    });

    it("drops the flags when Custom becomes Full", () => {
        const access = changeWorkflowsAccessLevel(CUSTOM_EDITOR, "full");

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: false });
    });

    it("drops the flags when Custom becomes No access", () => {
        const access = changeWorkflowsAccessLevel(CUSTOM_EDITOR, "none");

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });

    it("switches No access to Full and Full to No access", () => {
        const full = changeWorkflowsAccessLevel(NONE, "full");
        const none = changeWorkflowsAccessLevel(FULL, "none");

        expect(full).toEqual(FULL);
        expect(none).toEqual(NONE);
    });

    it("returns the same access for the same level", () => {
        const access = changeWorkflowsAccessLevel(CUSTOM_EDITOR, "custom");

        expect(access).toBe(CUSTOM_EDITOR);
    });

    it("returns a locked access unchanged", () => {
        const access = changeWorkflowsAccessLevel(LOCKED, "custom");

        expect(access).toBe(LOCKED);
    });
});
