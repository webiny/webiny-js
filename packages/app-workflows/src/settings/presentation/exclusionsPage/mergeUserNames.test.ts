import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { mergeUserNames } from "~/settings/presentation/exclusionsPage/mergeUserNames.js";

describe("mergeUserNames (R321, D117)", () => {
    it("names found users and marks missing ids as Deleted user", () => {
        const ana = createWorkflowUserSummary({ id: "user-a", displayName: "Ana Kovač" });

        const names = mergeUserNames(new Map(), { users: [ana], missingIds: ["user-b"] });

        expect(names.get("user-a")).toEqual({
            userId: "user-a",
            label: "Ana Kovač",
            state: "found"
        });
        expect(names.get("user-b")).toEqual({
            userId: "user-b",
            label: "Deleted user",
            state: "deleted"
        });
    });

    it("keeps the known names and returns a new map", () => {
        const known = new Map<string, ExclusionUserName>();
        known.set("user-c", { userId: "user-c", label: "Cid", state: "found" });

        const names = mergeUserNames(known, { users: [], missingIds: [] });

        expect(names).not.toBe(known);
        expect(names.get("user-c")?.label).toBe("Cid");
    });

    it("replaces an unknown name with the answer", () => {
        const known = new Map<string, ExclusionUserName>();
        known.set("user-a", { userId: "user-a", label: "user-a", state: "unknown" });
        const ana = createWorkflowUserSummary({ id: "user-a", displayName: "Ana Kovač" });

        const names = mergeUserNames(known, { users: [ana], missingIds: [] });

        expect(names.get("user-a")?.state).toBe("found");
    });
});
