import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { isTargetOutsideTeams } from "./isTargetOutsideTeams.js";

const references = createRuleReferences({
    users: [
        createReferenceLabel({ id: "user-mb", label: "Marko Babić" }),
        createReferenceLabel({ id: "user-nt", label: "No teams known" }),
        createReferenceLabel({ id: "user-gone", label: "Deleted user", state: "deleted" })
    ],
    teams: [
        createReferenceLabel({ id: "team-l", label: "Legal" }),
        createReferenceLabel({ id: "team-gone", label: "Deleted team", state: "deleted" })
    ],
    userTeamIds: { "user-mb": ["team-l"], "user-gone": [] }
});

describe("isTargetOutsideTeams", () => {
    it("flags a found user whose known teams are not reviewing teams", () => {
        const target = { type: "user" as const, id: "user-mb" };

        expect(isTargetOutsideTeams(target, ["team-m"], references)).toBe(true);
        expect(isTargetOutsideTeams(target, ["team-l"], references)).toBe(false);
    });

    it("does not flag a user with unknown teams, a deleted user or an unresolved one", () => {
        expect(isTargetOutsideTeams({ type: "user", id: "user-nt" }, [], references)).toBe(false);
        expect(isTargetOutsideTeams({ type: "user", id: "user-gone" }, [], references)).toBe(false);
        expect(isTargetOutsideTeams({ type: "user", id: "user-x" }, [], references)).toBe(false);
    });

    it("flags a found team that is not a reviewing team, never a deleted one", () => {
        expect(isTargetOutsideTeams({ type: "team", id: "team-l" }, ["team-m"], references)).toBe(
            true
        );
        expect(isTargetOutsideTeams({ type: "team", id: "team-l" }, ["team-l"], references)).toBe(
            false
        );
        expect(isTargetOutsideTeams({ type: "team", id: "team-gone" }, [], references)).toBe(false);
    });
});
