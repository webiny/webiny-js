import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { getTestRoutingSignature } from "./getTestRoutingSignature.js";
import type { TestRoutingInput } from "./TestRoutingInput.js";

const input = (overrides: Partial<TestRoutingInput> = {}): TestRoutingInput => {
    return {
        stepId: "step-1",
        teams: ["team-1"],
        strategy: "none",
        allowManualPick: false,
        rules: [createRuleValue({ id: "a" }), createRuleValue({ id: "b" })],
        requesterId: "user-1",
        folderId: null,
        ...overrides
    };
};

describe("getTestRoutingSignature (R300)", () => {
    it("is the same for the same input", () => {
        const first = getTestRoutingSignature(input());
        const second = getTestRoutingSignature(input());

        expect(first).toBe(second);
    });

    it("changes with the step", () => {
        const base = getTestRoutingSignature(input());

        const other = getTestRoutingSignature(input({ stepId: "step-2" }));

        expect(other).not.toBe(base);
    });

    it("changes with the teams", () => {
        const base = getTestRoutingSignature(input());

        const moreTeams = getTestRoutingSignature(input({ teams: ["team-1", "team-2"] }));
        const noTeams = getTestRoutingSignature(input({ teams: [] }));

        expect(moreTeams).not.toBe(base);
        expect(noTeams).not.toBe(base);
    });

    it("changes with the strategy, also from none to an unknown stored one", () => {
        const base = getTestRoutingSignature(input());

        const roundRobin = getTestRoutingSignature(input({ strategy: "roundRobin" }));
        const leastLoaded = getTestRoutingSignature(input({ strategy: "leastLoaded" }));
        const unknown = getTestRoutingSignature(input({ strategy: null }));

        expect(roundRobin).not.toBe(base);
        expect(leastLoaded).not.toBe(base);
        expect(unknown).not.toBe(base);
    });

    it("changes with the pick toggle", () => {
        const base = getTestRoutingSignature(input());

        const picking = getTestRoutingSignature(input({ allowManualPick: true }));

        expect(picking).not.toBe(base);
    });

    it("changes with any edit of the rules", () => {
        const base = getTestRoutingSignature(input());
        const [a, b] = input().rules;

        const reordered = input({ rules: [b, a] });
        const removed = input({ rules: [a] });
        const added = input({ rules: [a, b, createRuleValue({ id: "c" })] });
        const retargeted = input({
            rules: [{ ...a, target: { type: "user", id: "user-9" } }, b]
        });
        const withFolder = input({
            rules: [
                { ...a, folder: { id: "f1", type: "cms:article", includeDescendants: false } },
                b
            ]
        });

        for (const changed of [reordered, removed, added, retargeted, withFolder]) {
            const signature = getTestRoutingSignature(changed);

            expect(signature).not.toBe(base);
        }
    });

    it("changes with the requester and the folder", () => {
        const base = getTestRoutingSignature(input());

        const otherRequester = getTestRoutingSignature(input({ requesterId: "user-2" }));
        const noRequester = getTestRoutingSignature(input({ requesterId: null }));
        const withFolder = getTestRoutingSignature(input({ folderId: "f1" }));

        expect(otherRequester).not.toBe(base);
        expect(noRequester).not.toBe(base);
        expect(withFolder).not.toBe(base);
    });

    it("does not change with a field that is not an input of the test", () => {
        const withUnrelated = { ...input(), title: "Another title", color: "#ff0000" };

        const unrelated = getTestRoutingSignature(withUnrelated);
        const base = getTestRoutingSignature(input());

        expect(unrelated).toBe(base);
    });
});
