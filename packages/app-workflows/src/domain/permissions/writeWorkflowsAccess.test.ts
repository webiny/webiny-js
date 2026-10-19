import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Permission } from "@webiny/app-admin";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import { readWorkflowsAccess } from "./readWorkflowsAccess.js";
import { writeWorkflowsAccess } from "./writeWorkflowsAccess.js";

const NONE: WorkflowsAccess = { level: "none", editor: false, reassign: false, locked: false };
const FULL: WorkflowsAccess = { level: "full", editor: false, reassign: false, locked: false };
const LOCKED: WorkflowsAccess = { level: "full", editor: false, reassign: false, locked: true };
const CUSTOM_NONE: WorkflowsAccess = {
    level: "custom",
    editor: false,
    reassign: false,
    locked: false
};
const CUSTOM_EDITOR: WorkflowsAccess = {
    level: "custom",
    editor: true,
    reassign: false,
    locked: false
};
const CUSTOM_REASSIGN: WorkflowsAccess = {
    level: "custom",
    editor: false,
    reassign: true,
    locked: false
};
const CUSTOM_BOTH: WorkflowsAccess = {
    level: "custom",
    editor: true,
    reassign: true,
    locked: false
};

describe("writeWorkflowsAccess (R333, Q60)", () => {
    it("writes exactly { name: workflows.* } for Full, appended after the other entries", () => {
        const cms: Permission = { name: "cms.*" };

        const result = writeWorkflowsAccess([cms], FULL);

        expect(result).toEqual([{ name: "cms.*" }, { name: "workflows.*" }]);
        const written = result[1];
        expect(Object.keys(written)).toEqual(["name"]);
    });

    it("drops the legacy editor: true when Full is written again", () => {
        const result = writeWorkflowsAccess(
            [{ name: "workflows.*", editor: true }, { name: "cms.*" }],
            FULL
        );

        expect(result).toEqual([{ name: "cms.*" }, { name: "workflows.*" }]);
    });

    it("replaces a Custom entry with the Full entry", () => {
        const result = writeWorkflowsAccess([{ name: "workflows", editor: true }], FULL);

        expect(result).toEqual([{ name: "workflows.*" }]);
    });

    it("removes every workflows and workflows.* entry for No access and keeps the others in order", () => {
        const cms: Permission = { name: "cms.*" };
        const files: Permission = { name: "fm.file", rwd: "r" };
        const value: Permission[] = [
            cms,
            { name: "workflows", editor: true },
            files,
            { name: "workflows.*" },
            { name: "workflows", reassign: true }
        ];

        const result = writeWorkflowsAccess(value, NONE);

        expect(result).toEqual([{ name: "cms.*" }, { name: "fm.file", rwd: "r" }]);
        expect(result[0]).toBe(cms);
        expect(result[1]).toBe(files);
    });

    it("writes Custom with both ticked as one workflows entry with both flags", () => {
        const result = writeWorkflowsAccess([{ name: "workflows.*" }], CUSTOM_BOTH);

        expect(result).toEqual([{ name: "workflows", editor: true, reassign: true }]);
    });

    it("writes only the ticked flag and no key for the unticked one", () => {
        const result = writeWorkflowsAccess(
            [{ name: "workflows", editor: true, reassign: true }],
            CUSTOM_EDITOR
        );

        expect(result).toEqual([{ name: "workflows", editor: true }]);
        const entry = result[0];
        expect("reassign" in entry).toBe(false);
    });

    it("writes Reassign and operate alone", () => {
        const result = writeWorkflowsAccess([], CUSTOM_REASSIGN);

        expect(result).toEqual([{ name: "workflows", reassign: true }]);
    });

    it("writes Custom with nothing ticked as exactly { name: workflows }", () => {
        const result = writeWorkflowsAccess([{ name: "cms.*" }], CUSTOM_NONE);

        expect(result).toEqual([{ name: "cms.*" }, { name: "workflows" }]);
        const entry = result[1];
        expect(Object.keys(entry)).toEqual(["name"]);
    });

    it("reads an empty Custom back as Custom with nothing ticked (QBZ-77)", () => {
        const written = writeWorkflowsAccess([], CUSTOM_NONE);

        const access = readWorkflowsAccess(written);

        expect(access).toEqual(CUSTOM_NONE);
    });

    it("reads every written level back as the same access", () => {
        const levels: WorkflowsAccess[] = [NONE, FULL, CUSTOM_EDITOR, CUSTOM_REASSIGN, CUSTOM_BOTH];

        for (const level of levels) {
            const written = writeWorkflowsAccess([{ name: "cms.*" }], level);
            const access = readWorkflowsAccess(written);

            expect(access).toEqual(level);
        }
    });

    it("keeps the other keys of the first workflows entry on Custom", () => {
        const value: Permission[] = [
            { name: "workflows", editor: true, reassign: true, teams: ["t1"] },
            { name: "workflows", other: 1 }
        ];

        const result = writeWorkflowsAccess(value, CUSTOM_EDITOR);

        expect(result).toEqual([{ name: "workflows", teams: ["t1"], editor: true }]);
    });

    it("removes string flags of the existing entry and writes booleans", () => {
        const result = writeWorkflowsAccess(
            [{ name: "workflows", editor: "yes", reassign: "no" }],
            CUSTOM_REASSIGN
        );

        expect(result).toEqual([{ name: "workflows", reassign: true }]);
    });

    it("does not copy the keys of a workflows.* entry into Custom", () => {
        const result = writeWorkflowsAccess([{ name: "workflows.*", editor: true }], CUSTOM_NONE);

        expect(result).toEqual([{ name: "workflows" }]);
    });

    it("keeps other workflows names such as workflows.read untouched", () => {
        const read: Permission = { name: "workflows.read", editor: true };

        const result = writeWorkflowsAccess([read, { name: "workflows" }], FULL);

        expect(result).toEqual([{ name: "workflows.read", editor: true }, { name: "workflows.*" }]);
        expect(result[0]).toBe(read);
    });

    it("keeps a * entry in place on a write that is not locked", () => {
        const result = writeWorkflowsAccess([{ name: "*" }, { name: "workflows.*" }], NONE);

        expect(result).toEqual([{ name: "*" }]);
    });

    it("writes nothing over a locked access: a copy of the list, unchanged", () => {
        const value: Permission[] = [{ name: "*" }, { name: "workflows", editor: true }];

        const result = writeWorkflowsAccess(value, LOCKED);

        expect(result).toEqual([{ name: "*" }, { name: "workflows", editor: true }]);
        expect(result).not.toBe(value);
    });

    it("starts from an empty list when the value is not an array", () => {
        const notAList = null as unknown as Permission[];

        const result = writeWorkflowsAccess(notAList, FULL);

        expect(result).toEqual([{ name: "workflows.*" }]);
    });

    it("never mutates the input list or its entries", () => {
        const value: Permission[] = [
            { name: "cms.*" },
            { name: "workflows", editor: true, teams: ["t1"] }
        ];
        const before = structuredClone(value);

        writeWorkflowsAccess(value, CUSTOM_REASSIGN);
        writeWorkflowsAccess(value, FULL);
        writeWorkflowsAccess(value, NONE);

        expect(value).toEqual(before);
    });
});
