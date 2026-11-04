import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Permission } from "@webiny/app-admin";
import { readWorkflowsAccess } from "./readWorkflowsAccess.js";

describe("readWorkflowsAccess (R333, Q60, Q68.5)", () => {
    it("reads an empty list as No access", () => {
        const access = readWorkflowsAccess([]);

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });

    it("reads a list without workflows entries as No access", () => {
        const access = readWorkflowsAccess([{ name: "cms.*" }, { name: "fm.file", rwd: "r" }]);

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["an object", { name: "workflows.*" }]
    ])("reads a value that is not an array (%s) as No access", (_label, raw) => {
        const notAList = raw as unknown as Permission[];

        const access = readWorkflowsAccess(notAList);

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });

    it("reads a * entry (the API key form) as Full and locked", () => {
        const access = readWorkflowsAccess([{ name: "*" }]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: true });
    });

    it("keeps * locked when workflows entries sit next to it", () => {
        const access = readWorkflowsAccess([
            { name: "workflows", editor: true },
            { name: "*" },
            { name: "workflows.*" }
        ]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: true });
    });

    it.each([["workflows*"], ["*.*"], ["**"]])(
        "reads a %s entry the server matches against workflows.* as Full and locked",
        name => {
            const access = readWorkflowsAccess([{ name }]);

            expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: true });
        }
    );

    it("keeps a workflows* entry locked next to the legacy workflows.* entry", () => {
        const access = readWorkflowsAccess([
            { name: "workflows*" },
            { name: "workflows.*", editor: true }
        ]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: true });
    });

    it.each([["cms.*"], ["workflowsX"]])("does not lock for a %s entry", name => {
        const access = readWorkflowsAccess([{ name }]);

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });

    it("reads an entry without a name without throwing", () => {
        const nameless = { editor: true } as unknown as Permission;

        const access = readWorkflowsAccess([nameless, { name: "workflows", reassign: true }]);

        expect(access).toEqual({ level: "custom", editor: false, reassign: true, locked: false });
    });

    it("reads { name: workflows.* } as Full", () => {
        const access = readWorkflowsAccess([{ name: "cms.*" }, { name: "workflows.*" }]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: false });
    });

    it("reads the legacy { name: workflows.*, editor: true } as Full", () => {
        const access = readWorkflowsAccess([{ name: "workflows.*", editor: true }]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: false });
    });

    it("reads workflows.* as Full even next to a workflows entry with flags", () => {
        const access = readWorkflowsAccess([
            { name: "workflows", editor: true },
            { name: "workflows.*" }
        ]);

        expect(access).toEqual({ level: "full", editor: false, reassign: false, locked: false });
    });

    it("reads a workflows entry with nothing set as Custom with nothing ticked (QBZ-77)", () => {
        const access = readWorkflowsAccess([{ name: "workflows" }]);

        expect(access).toEqual({ level: "custom", editor: false, reassign: false, locked: false });
    });

    it("reads editor: true as Custom with Manage workflows ticked", () => {
        const access = readWorkflowsAccess([{ name: "workflows", editor: true }]);

        expect(access).toEqual({ level: "custom", editor: true, reassign: false, locked: false });
    });

    it("reads reassign: true as Custom with Reassign and operate ticked", () => {
        const access = readWorkflowsAccess([{ name: "workflows", reassign: true }]);

        expect(access).toEqual({ level: "custom", editor: false, reassign: true, locked: false });
    });

    it("reads both flags as Custom with both ticked", () => {
        const access = readWorkflowsAccess([{ name: "workflows", editor: true, reassign: true }]);

        expect(access).toEqual({ level: "custom", editor: true, reassign: true, locked: false });
    });

    it("reads string flags such as yes as not set (only true counts)", () => {
        const access = readWorkflowsAccess([{ name: "workflows", editor: "yes", reassign: "yes" }]);

        expect(access).toEqual({ level: "custom", editor: false, reassign: false, locked: false });
    });

    it("combines the flags of several workflows entries", () => {
        const access = readWorkflowsAccess([
            { name: "workflows", editor: true },
            { name: "cms.*" },
            { name: "workflows", reassign: true }
        ]);

        expect(access).toEqual({ level: "custom", editor: true, reassign: true, locked: false });
    });

    it("reads an unrecognised workflows entry by its flags (Q68.5)", () => {
        const access = readWorkflowsAccess([
            { name: "workflows", editor: true, accessLevel: "full", teams: ["t1"] }
        ]);

        expect(access).toEqual({ level: "custom", editor: true, reassign: false, locked: false });
    });

    it("does not own other workflows names such as workflows.read", () => {
        const access = readWorkflowsAccess([{ name: "workflows.read", editor: true }]);

        expect(access).toEqual({ level: "none", editor: false, reassign: false, locked: false });
    });
});
