import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import { dropOverriddenIssues } from "./dropOverriddenIssues.js";
import { getRuleLines } from "./getRuleLines.js";
import type { RuleErrorVm } from "./abstractions.js";

const issue = (overrides: Partial<RuleIssue>): RuleIssue => {
    return {
        ruleId: "r-1",
        index: 0,
        kind: "error",
        field: "target",
        message: "The assigned user was deleted.",
        ...overrides
    };
};

const serverError = (overrides: Partial<RuleErrorVm>): RuleErrorVm => {
    return { ruleId: "r-1", field: "target", message: "Server says no.", ...overrides };
};

describe("dropOverriddenIssues (R303)", () => {
    it("drops the live error of the rule and field a server error names, and keeps the rest", () => {
        const issues = [
            issue({ ruleId: "r-1", field: "target", message: "Live error." }),
            issue({ ruleId: "r-1", field: "folder", kind: "warning", message: "Live warning." }),
            issue({ ruleId: "r-2", field: "target", message: "Other rule." })
        ];

        const kept = dropOverriddenIssues(issues, [
            serverError({ ruleId: "r-1", field: "target" })
        ]);

        expect(kept.map(item => item.message)).toEqual(["Live warning.", "Other rule."]);
    });

    it("never drops a warning, even for the same rule and field", () => {
        const warning = issue({ kind: "warning", field: "folder", message: "Folder is gone." });

        const kept = dropOverriddenIssues([warning], [serverError({ field: "folder" })]);

        expect(kept).toEqual([warning]);
    });

    it("returns the issues as they are when there is no server error", () => {
        const issues = [issue({})];

        expect(dropOverriddenIssues(issues, [])).toEqual(issues);
    });
});

describe("getRuleLines (R312)", () => {
    it("prefixes every line with the rule's position, server errors before live issues, with severity and rule id", () => {
        const lines = getRuleLines({
            ruleIds: ["r-a", "r-b", "r-c"],
            issues: [
                issue({ ruleId: "r-c", message: "Third." }),
                issue({ ruleId: "r-b", kind: "warning", message: "Second warning." })
            ],
            errors: [serverError({ ruleId: "r-b", message: "Second error." })]
        });

        expect(lines).toEqual([
            { text: "Rule 2: Second error.", severity: "error", ruleId: "r-b" },
            { text: "Rule 2: Second warning.", severity: "warning", ruleId: "r-b" },
            { text: "Rule 3: Third.", severity: "error", ruleId: "r-c" }
        ]);
    });

    it("skips a rule that is not in the list and gives nothing for no rules", () => {
        expect(
            getRuleLines({
                ruleIds: ["r-a"],
                issues: [issue({ ruleId: "r-gone" })],
                errors: [serverError({ ruleId: "r-gone" })]
            })
        ).toEqual([]);
        expect(getRuleLines({ ruleIds: [], issues: [], errors: [] })).toEqual([]);
    });
});
