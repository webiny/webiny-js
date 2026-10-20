import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { StepFormRuleError } from "../../StepFormOptions.js";
import { getRuleFieldMessages } from "./getRuleFieldMessages.js";

const issue = (overrides: Partial<RuleIssue>): RuleIssue => {
    return {
        ruleId: "rule-1",
        index: 0,
        kind: "error",
        field: "target",
        message: "Choose who this rule assigns to.",
        ...overrides
    };
};

const serverError = (overrides: Partial<StepFormRuleError>): StepFormRuleError => {
    return { ruleId: "rule-1", field: "target", message: "Server says no.", ...overrides };
};

describe("getRuleFieldMessages (R299, R303)", () => {
    it("has no message, no error and no warning for a clean rule", () => {
        expect(getRuleFieldMessages([], [])).toEqual({
            target: null,
            requesterUser: null,
            requesterTeam: null,
            folder: null,
            hasError: false,
            warnings: []
        });
    });

    it("puts a live error on its field and marks the rule as holding an error", () => {
        const messages = getRuleFieldMessages([issue({})], []);

        expect(messages.target).toBe("Choose who this rule assigns to.");
        expect(messages.requesterUser).toBeNull();
        expect(messages.hasError).toBe(true);
    });

    it("lets a server error replace the live error of the same field instead of doubling it", () => {
        const messages = getRuleFieldMessages(
            [issue({ message: "Ivan Horvat is no longer in the reviewing teams." })],
            [serverError({ message: "The target user is not a member of the step's teams." })]
        );

        expect(messages.target).toBe("The target user is not a member of the step's teams.");
    });

    it("keeps a live error of one field next to a server error of another", () => {
        const messages = getRuleFieldMessages(
            [issue({ field: "requesterTeam", message: "The team was deleted." })],
            [serverError({ field: "folder", message: "The folder is invalid." })]
        );

        expect(messages.requesterTeam).toBe("The team was deleted.");
        expect(messages.folder).toBe("The folder is invalid.");
        expect(messages.target).toBeNull();
        expect(messages.hasError).toBe(true);
    });

    it("lists the warnings in order without a prefix and does not mark them as an error", () => {
        const messages = getRuleFieldMessages(
            [
                issue({
                    kind: "warning",
                    field: "requesterTeam",
                    message: "The team was deleted."
                }),
                issue({ kind: "warning", field: "folder", message: "The folder no longer exists." })
            ],
            []
        );

        expect(messages.warnings).toEqual([
            "The team was deleted.",
            "The folder no longer exists."
        ]);
        expect(messages.requesterTeam).toBeNull();
        expect(messages.folder).toBeNull();
        expect(messages.hasError).toBe(false);
    });
});
