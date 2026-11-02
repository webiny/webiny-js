import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { RoutingInspection } from "~/editor/domain/types.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import { composeTestRoutingResult } from "./composeTestRoutingResult.js";
import type { InspectionNames } from "./TestRoutingContext.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";

const RULES = [
    createRuleValue({
        id: "r1",
        requesterTeamId: "team-m",
        target: { type: "user", id: "user-iv" }
    }),
    createRuleValue({
        id: "r2",
        folder: { id: "f1", type: "cms:article", includeDescendants: true },
        target: { type: "team", id: "team-l" }
    }),
    createRuleValue({
        id: "r3",
        requesterUserId: "user-iv",
        requesterTeamId: "team-m",
        folder: { id: "f1", type: "cms:article", includeDescendants: true },
        target: { type: "team", id: "team-l" }
    }),
    createRuleValue({
        id: "r4",
        folder: { id: "f1", type: "cms:article", includeDescendants: false },
        target: { type: "team", id: "team-l" }
    })
];

const REFERENCES = createRuleReferences({
    users: [createReferenceLabel({ id: "user-iv", label: "Ivan Horvat" })],
    teams: [
        createReferenceLabel({ id: "team-m", label: "Marketing" }),
        createReferenceLabel({ id: "team-l", label: "Legal" })
    ],
    folders: [createReferenceLabel({ id: "f1", label: "/Campaigns" })]
});

const names = (
    users: Record<string, string> = {},
    teams: Record<string, string> = {}
): InspectionNames => {
    return { users: new Map(Object.entries(users)), teams: new Map(Object.entries(teams)) };
};

const context = (overrides: Partial<TestRoutingContext> = {}): TestRoutingContext => {
    return {
        rules: RULES,
        strategy: "none",
        references: REFERENCES,
        names: names(),
        ...overrides
    };
};

const inspection = (overrides: Partial<RoutingInspection> = {}): RoutingInspection => {
    return {
        owner: null,
        source: "pool",
        ruleId: null,
        strategy: "none",
        narrowedTeamId: null,
        candidateIds: [],
        candidateCount: 0,
        trace: [],
        skipped: [],
        ...overrides
    };
};

const notMatched = (
    ruleId: string,
    failedConditions: RoutingInspection["trace"][number]["failedConditions"],
    reason: string | null = null
): RoutingInspection["trace"][number] => {
    return { ruleId, outcome: "notMatched", reason, failedConditions };
};

describe("composeTestRoutingResult: the owner (R301)", () => {
    it("shows the person a rule chose, with the rules after it not evaluated", () => {
        const result = composeTestRoutingResult(
            inspection({
                owner: { id: "user-iv", displayName: "Ivan Horvat" },
                source: "rule",
                ruleId: "r1",
                trace: [
                    { ruleId: "r1", outcome: "matched", reason: null, failedConditions: [] },
                    { ruleId: "r2", outcome: "notEvaluated", reason: null, failedConditions: [] },
                    { ruleId: "r3", outcome: "notEvaluated", reason: null, failedConditions: [] }
                ]
            }),
            context()
        );

        expect(result.ownerLabel).toBe("Ivan Horvat");
        expect(result.ownerIcon).toBe("person");
        expect(result.reason).toBe("Assigned by rule 1");
        expect(result.strategyLine).toBe("Not used: a rule chose the reviewer.");
        expect(result.trace).toEqual([
            {
                ruleId: "r1",
                tag: "Matched",
                label: "Rule 1: If requester is in Marketing → Ivan Horvat",
                reason: "All conditions match."
            },
            {
                ruleId: "r2",
                tag: "Skipped",
                label: "Rule 2: If content is in /Campaigns (incl. subfolders) → Legal team pool",
                reason: "An earlier rule matched."
            },
            {
                ruleId: "r3",
                tag: "Skipped",
                label: "Rule 3: If requester is Ivan Horvat and requester is in Marketing and content is in /Campaigns (incl. subfolders) → Legal team pool",
                reason: "An earlier rule matched."
            }
        ]);
    });

    it("shows the team pool when no rule matched and the strategy is none", () => {
        const result = composeTestRoutingResult(inspection(), context());

        expect(result.ownerLabel).toBe("Team pool");
        expect(result.ownerIcon).toBe("groups");
        expect(result.reason).toBe("No rule matched; waits in the team pool.");
        expect(result.strategyLine).toBe("None: the step waits in the team pool.");
        expect(result.trace).toEqual([]);
        expect(result.skipped).toEqual([]);
    });

    it("names the team in the no-rule sentence when the step has exactly one reviewing team", () => {
        const one = composeTestRoutingResult(inspection(), context({ stepTeamIds: ["team-l"] }));
        const two = composeTestRoutingResult(
            inspection(),
            context({ stepTeamIds: ["team-l", "team-m"] })
        );

        expect(one.reason).toBe("No rule matched; waits in the Legal team pool.");
        expect(two.reason).toBe("No rule matched; waits in the team pool.");
    });

    it("says which rule sent it to which team pool for a matched team rule with strategy none", () => {
        const result = composeTestRoutingResult(
            inspection({
                ruleId: "r2",
                narrowedTeamId: "team-l",
                trace: [
                    { ruleId: "r1", outcome: "notMatched", reason: null, failedConditions: [] },
                    { ruleId: "r2", outcome: "matched", reason: null, failedConditions: [] }
                ]
            }),
            context({ names: names({}, { "team-l": "Legal" }) })
        );

        expect(result.ownerLabel).toBe("Team pool");
        expect(result.reason).toBe("Rule 2 sent it to the Legal team pool.");
        expect(result.strategyLine).toBe("None: the step waits in the team pool.");
    });

    it("takes the narrowed team's name from the references when the names have none, and never throws for an unknown team", () => {
        const fromReferences = composeTestRoutingResult(
            inspection({ ruleId: "r2", narrowedTeamId: "team-l" }),
            context()
        );
        const unknown = composeTestRoutingResult(
            inspection({ ruleId: "r2", narrowedTeamId: "team-x" }),
            context()
        );

        expect(fromReferences.reason).toBe("Rule 2 sent it to the Legal team pool.");
        expect(unknown.reason).toContain("Deleted team");
    });

    it("falls back to Assigned by rule when a rule sent it to the pool without a narrowed team", () => {
        const result = composeTestRoutingResult(inspection({ ruleId: "r2" }), context());

        expect(result.reason).toBe("Assigned by rule 2");
    });

    it("treats a rule id that is in neither the rules nor the trace as no rule", () => {
        const result = composeTestRoutingResult(inspection({ ruleId: "gone" }), context());

        expect(result.reason).toBe("No rule matched; waits in the team pool.");
    });

    it("says Round-robin chose the person when no rule narrowed it", () => {
        const result = composeTestRoutingResult(
            inspection({
                owner: { id: "user-a", displayName: "Ana" },
                source: "roundRobin",
                strategy: "roundRobin",
                candidateIds: ["user-a", "user-b"],
                candidateCount: 2
            }),
            context({ strategy: "roundRobin", names: names({ "user-a": "Ana", "user-b": "Bob" }) })
        );

        expect(result.ownerLabel).toBe("Ana");
        expect(result.reason).toBe("Round-robin chose Ana.");
        expect(result.strategyLine).toBe("Round-robin across Ana, Bob: Ana is next in rotation.");
    });

    it("says which rule narrowed it to which team, for round-robin and least-loaded", () => {
        const base = inspection({
            owner: { id: "user-a", displayName: "Ana" },
            ruleId: "r2",
            narrowedTeamId: "team-l",
            candidateIds: ["user-a"],
            candidateCount: 1
        });
        const withNames = names({ "user-a": "Ana" }, { "team-l": "Legal" });

        const roundRobin = composeTestRoutingResult(
            { ...base, source: "roundRobin", strategy: "roundRobin" },
            context({ strategy: "roundRobin", names: withNames })
        );
        const leastLoaded = composeTestRoutingResult(
            { ...base, source: "leastLoaded", strategy: "leastLoaded" },
            context({ strategy: "leastLoaded", names: withNames })
        );

        expect(roundRobin.reason).toBe(
            "Rule 2 narrowed it to the Legal team; round-robin chose Ana."
        );
        expect(leastLoaded.reason).toBe(
            "Rule 2 narrowed it to the Legal team; least-loaded chose Ana."
        );
    });

    it("says Least-loaded chose the person and why", () => {
        const result = composeTestRoutingResult(
            inspection({
                owner: { id: "user-a", displayName: "Ana" },
                source: "leastLoaded",
                strategy: "leastLoaded",
                candidateIds: ["user-a", "user-b"],
                candidateCount: 2
            }),
            context({ strategy: "leastLoaded" })
        );

        expect(result.reason).toBe("Least-loaded chose Ana.");
        expect(result.strategyLine).toBe("Least-loaded chose Ana: fewest open reviews.");
    });

    it("sends it to the pool when every candidate was skipped, for both strategies", () => {
        const roundRobin = composeTestRoutingResult(
            inspection({ strategy: "roundRobin" }),
            context({ strategy: "roundRobin" })
        );
        const leastLoaded = composeTestRoutingResult(
            inspection({ strategy: "leastLoaded", ruleId: "r2", narrowedTeamId: "team-l" }),
            context({ strategy: "leastLoaded" })
        );

        expect(roundRobin.ownerLabel).toBe("Team pool");
        expect(roundRobin.reason).toBe("Sent to team pool: all candidates were skipped.");
        expect(roundRobin.strategyLine).toBe("Round-robin: no eligible candidate.");
        expect(leastLoaded.reason).toBe("Sent to team pool: all candidates were skipped.");
        expect(leastLoaded.strategyLine).toBe("Least-loaded: no eligible candidate.");
    });
});

describe("composeTestRoutingResult: the round-robin candidates (R289, R301)", () => {
    const roundRobin = (overrides: Partial<RoutingInspection>): RoutingInspection => {
        return inspection({
            owner: { id: "user-a", displayName: "Ana" },
            source: "roundRobin",
            strategy: "roundRobin",
            ...overrides
        });
    };

    it("names up to three candidates and says and others when there are more", () => {
        const result = composeTestRoutingResult(
            roundRobin({ candidateIds: ["user-a", "user-b", "user-c"], candidateCount: 5 }),
            context({ names: names({ "user-a": "Ana", "user-b": "Bob", "user-c": "Cy" }) })
        );

        expect(result.strategyLine).toBe(
            "Round-robin across Ana, Bob, Cy and others: Ana is next in rotation."
        );
    });

    it("does not say and others when every candidate is named", () => {
        const result = composeTestRoutingResult(
            roundRobin({ candidateIds: ["user-a", "user-b", "user-c"], candidateCount: 3 }),
            context({ names: names({ "user-a": "Ana", "user-b": "Bob", "user-c": "Cy" }) })
        );

        expect(result.strategyLine).toBe(
            "Round-robin across Ana, Bob, Cy: Ana is next in rotation."
        );
    });

    it("names the owner from the inspection and an unnamed candidate Deleted user", () => {
        const result = composeTestRoutingResult(
            roundRobin({ candidateIds: ["user-a", "user-gone"], candidateCount: 2 }),
            context()
        );

        expect(result.strategyLine).toBe(
            "Round-robin across Ana, Deleted user: Ana is next in rotation."
        );
    });

    it("takes a candidate's name from the references when the names have none", () => {
        const references: RuleReferences = createRuleReferences({
            users: [createReferenceLabel({ id: "user-b", label: "Bob" })]
        });

        const result = composeTestRoutingResult(
            roundRobin({ candidateIds: ["user-a", "user-b"], candidateCount: 2 }),
            context({ references })
        );

        expect(result.strategyLine).toBe("Round-robin across Ana, Bob: Ana is next in rotation.");
    });
});

describe("composeTestRoutingResult: the trace rows (R301)", () => {
    it("names every failed condition, joined with and and capitalised", () => {
        const result = composeTestRoutingResult(
            inspection({
                trace: [notMatched("r3", ["requesterUser", "requesterTeam", "folder"])]
            }),
            context()
        );

        expect(result.trace[0].tag).toBe("Not matched");
        expect(result.trace[0].label).toBe(
            "Rule 3: If requester is Ivan Horvat and requester is in Marketing and content is in /Campaigns (incl. subfolders) → Legal team pool"
        );
        expect(result.trace[0].reason).toBe(
            "Requester is not Ivan Horvat and requester is not in Marketing and content is not in /Campaigns or its subfolders."
        );
    });

    it("names a single failed condition", () => {
        const result = composeTestRoutingResult(
            inspection({ trace: [notMatched("r1", ["requesterTeam"])] }),
            context()
        );

        expect(result.trace[0].reason).toBe("Requester is not in Marketing.");
    });

    it("says or its subfolders only for a folder that includes them", () => {
        const result = composeTestRoutingResult(
            inspection({ trace: [notMatched("r2", ["folder"]), notMatched("r4", ["folder"])] }),
            context()
        );

        expect(result.trace[0].reason).toBe("Content is not in /Campaigns or its subfolders.");
        expect(result.trace[1].reason).toBe("Content is not in /Campaigns.");
    });

    it("says the restricted folder for a folder the admin cannot see", () => {
        const references = createRuleReferences({
            folders: [
                createReferenceLabel({ id: "f1", label: "Restricted folder", state: "restricted" })
            ]
        });

        const result = composeTestRoutingResult(
            inspection({ trace: [notMatched("r2", ["folder"])] }),
            context({ references })
        );

        expect(result.trace[0].reason).toBe(
            "Content is not in the restricted folder or its subfolders."
        );
    });

    it("uses the server reason when no condition is named, and the fallback when it has none either", () => {
        const withReason = composeTestRoutingResult(
            inspection({ trace: [notMatched("r1", [], "The server says so.")] }),
            context()
        );
        const withoutReason = composeTestRoutingResult(
            inspection({ trace: [notMatched("r1", [])] }),
            context()
        );

        expect(withReason.trace[0].reason).toBe("The server says so.");
        expect(withoutReason.trace[0].reason).toBe("A condition on this rule does not match.");
    });

    it("says All conditions match for a matched row without a reason and keeps a server reason", () => {
        const result = composeTestRoutingResult(
            inspection({
                trace: [
                    { ruleId: "r1", outcome: "matched", reason: null, failedConditions: [] },
                    {
                        ruleId: "r2",
                        outcome: "matched",
                        reason: "Matched anyway.",
                        failedConditions: []
                    }
                ]
            }),
            context()
        );

        expect(result.trace.map(row => row.reason)).toEqual([
            "All conditions match.",
            "Matched anyway."
        ]);
    });

    it("shows the server's reason of a skipped row verbatim and the fallback for a null reason", () => {
        const result = composeTestRoutingResult(
            inspection({
                trace: [
                    {
                        ruleId: "r1",
                        outcome: "skipped",
                        reason: "Not a member of the step's teams.",
                        failedConditions: []
                    },
                    { ruleId: "r2", outcome: "skipped", reason: null, failedConditions: [] }
                ]
            }),
            context()
        );

        expect(result.trace[0].tag).toBe("Skipped");
        expect(result.trace[0].reason).toBe("Not a member of the step's teams.");
        expect(result.trace[1].tag).toBe("Skipped");
        expect(result.trace[1].reason).toBe("A condition on this rule does not match.");
    });

    it("renders a trace entry whose rule is not among the rules as Rule with its position and does not throw", () => {
        const result = composeTestRoutingResult(
            inspection({
                trace: [
                    { ruleId: "r1", outcome: "matched", reason: null, failedConditions: [] },
                    notMatched("gone", ["folder"], "Server reason.")
                ]
            }),
            context()
        );

        expect(result.trace[1]).toEqual({
            ruleId: "gone",
            tag: "Not matched",
            label: "Rule 2",
            reason: "Server reason."
        });
    });

    it("numbers the rows by the rules of the request, so a stale result keeps its numbering", () => {
        const reordered = [RULES[1], RULES[0]];

        const result = composeTestRoutingResult(
            inspection({
                trace: [{ ruleId: "r1", outcome: "matched", reason: null, failedConditions: [] }]
            }),
            context({ rules: reordered })
        );

        expect(result.trace[0].label.startsWith("Rule 2: ")).toBe(true);
    });
});

describe("composeTestRoutingResult: the skipped people (R301, copy gap 4)", () => {
    it("shows the server's reason verbatim with the server's name, the resolved name or Deleted user", () => {
        const result = composeTestRoutingResult(
            inspection({
                skipped: [
                    {
                        userId: "user-a",
                        displayName: "Ana",
                        reason: "The requester cannot review."
                    },
                    {
                        userId: "user-b",
                        displayName: null,
                        reason: "Not a member of the step's teams."
                    },
                    { userId: "user-gone", displayName: null, reason: "Cannot read this content." }
                ]
            }),
            context({ names: names({ "user-b": "Bob" }) })
        );

        expect(result.skipped).toEqual([
            { name: "Ana", reason: "The requester cannot review." },
            { name: "Bob", reason: "Not a member of the step's teams." },
            { name: "Deleted user", reason: "Cannot read this content." }
        ]);
    });
});
