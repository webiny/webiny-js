import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createRule } from "./createRule.js";

describe("createRule (R296)", () => {
    it("targets the pool of the first reviewing team and has no condition", () => {
        const rule = createRule(["team-2", "team-1"], []);

        expect(rule).toEqual({
            id: rule.id,
            requesterUserId: null,
            requesterTeamId: null,
            folder: null,
            target: { type: "team", id: "team-2" },
            preserved: {}
        });
    });

    it("has no target when the step has no teams", () => {
        const rule = createRule([], []);

        expect(rule.target).toBeNull();
    });

    it("creates an id that is not among the existing ones", () => {
        const first = createRule(["team-1"], []);
        const second = createRule(["team-1"], [first.id]);

        expect(first.id).toMatch(/^r[a-z0-9]{12}$/);
        expect(second.id).not.toBe(first.id);
    });
});
