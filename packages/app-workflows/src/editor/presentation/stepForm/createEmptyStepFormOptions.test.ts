import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createEmptyStepFormOptions } from "./createEmptyStepFormOptions.js";

describe("createEmptyStepFormOptions (the 9b slices)", () => {
    it("has every 9b list loaded and empty, with callbacks that do nothing", () => {
        const options = createEmptyStepFormOptions();

        expect(options.assignment).toEqual({ stepTeamIds: [], strategy: null });
        expect(options.users).toMatchObject({
            loading: false,
            failed: false,
            items: [],
            selected: []
        });
        expect(options.targetMembers).toMatchObject({
            loading: false,
            failed: false,
            items: [],
            selected: []
        });
        expect(options.folders).toMatchObject({
            loading: false,
            failed: false,
            items: [],
            folderType: ""
        });
        expect(options.references).toMatchObject({ loading: false, failed: false });
        expect(options.references.users.size).toBe(0);
        expect(options.references.teams.size).toBe(0);
        expect(options.references.folders.size).toBe(0);
        expect(options.references.userTeamIds.size).toBe(0);
        expect(options.ruleErrors.items).toEqual([]);
        expect(options.ruleIssues.items).toEqual([]);
        expect(options.testRouting.vm).toMatchObject({
            requesterId: null,
            folderId: null,
            canRun: false,
            status: "idle",
            stale: false,
            result: null,
            errorMessage: null
        });
    });

    it("gives every callback a function that is safe to call", () => {
        const options = createEmptyStepFormOptions();

        expect(() => options.users.searchUsers("a")).not.toThrow();
        expect(() => options.users.retry()).not.toThrow();
        expect(() => options.targetMembers.searchTargetMembers(["team-1"], "a")).not.toThrow();
        expect(() => options.targetMembers.retry()).not.toThrow();
        expect(() => options.folders.retry()).not.toThrow();
        expect(() => options.references.retry()).not.toThrow();
        expect(() => options.ruleErrors.clearRuleError("rule-1")).not.toThrow();
        expect(() => options.testRouting.setTestRequester("user-1")).not.toThrow();
        expect(() => options.testRouting.setTestFolder(null)).not.toThrow();
        expect(() => options.testRouting.runTest()).not.toThrow();
    });
});
