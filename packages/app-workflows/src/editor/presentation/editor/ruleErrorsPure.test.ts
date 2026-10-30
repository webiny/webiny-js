import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";
import { getStepErrorTab } from "~/editor/model/getStepErrorTab.js";
import { getStepRuleIds } from "~/editor/model/getStepRuleIds.js";
import { getRuleErrorField } from "~/editor/presentation/stepDrawer/getRuleErrorField.js";
import { getRuleErrorsFromSave } from "./getRuleErrorsFromSave.js";
import type { ValidationFailure } from "./mapSaveError.js";

const step = () => {
    return createRoutingStep([
        createStoredRule({ id: "r-a" }),
        createStoredRule({ id: "r-b" }),
        createStoredRule({ id: "r-c" })
    ]);
};

const failure = (overrides: Partial<ValidationFailure>): ValidationFailure => {
    return {
        kind: "validation",
        message: "Something is wrong.",
        stepId: "step-1",
        field: null,
        workflowId: null,
        ruleId: null,
        ...overrides
    };
};

describe("getRuleErrorsFromSave (R303)", () => {
    it("keeps the rule id and the field of a rule-level failure", () => {
        const errors = getRuleErrorsFromSave(
            failure({
                field: "config.assignment.rules.target",
                ruleId: "r-b",
                message: "The target user is not a member of the step's teams."
            }),
            step()
        );

        expect(errors).toEqual([
            {
                field: "config.assignment.rules.target",
                message: "The target user is not a member of the step's teams.",
                ruleId: "r-b"
            }
        ]);
    });

    it("converts the index of a schema failure to the id of the rule at that index and drops it from the field", () => {
        const errors = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.2.target.id", message: "Required." }),
            step()
        );

        expect(errors).toEqual([
            { field: "config.assignment.rules.target.id", message: "Required.", ruleId: "r-c" }
        ]);
    });

    it("keeps the error on its rule when the rules are reordered later", () => {
        const [error] = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.0.conditions.requesterUserId" }),
            step()
        );
        const reordered = ["r-c", "r-b", "r-a"];

        expect(error.ruleId).toBe("r-a");
        expect(reordered.indexOf(error.ruleId ?? "") + 1).toBe(3);
    });

    it("maps a schema failure of the rule itself", () => {
        const errors = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.1", message: "Invalid rule." }),
            step()
        );

        expect(errors).toEqual([
            { field: "config.assignment.rules", message: "Invalid rule.", ruleId: "r-b" }
        ]);
    });

    it("leaves the rule id empty for an index no rule has, and for no step", () => {
        const outOfRange = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.9.target.id" }),
            step()
        );
        const noStep = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.0.target.id" }),
            null
        );

        expect(outOfRange[0].ruleId).toBeNull();
        expect(outOfRange[0].field).toBe("config.assignment.rules.target.id");
        expect(noStep[0].ruleId).toBeNull();
    });

    it("maps the stored index past an unreadable rule onto the readable rule", () => {
        const stored: unknown[] = ["not a rule", createStoredRule({ id: "r-a" })];
        const withUnread = createReviewStep({
            id: "step-1",
            config: {
                teams: ["team-1"],
                assignment: { strategy: "none", allowManualPick: false, rules: stored }
            }
        });

        const onReadable = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.1.target.id" }),
            withUnread
        );
        const onUnreadable = getRuleErrorsFromSave(
            failure({ field: "config.assignment.rules.0" }),
            withUnread
        );

        expect(onReadable).toEqual([
            {
                field: "config.assignment.rules.target.id",
                message: "Something is wrong.",
                ruleId: "r-a"
            }
        ]);
        expect(onUnreadable).toEqual([
            { field: "config.assignment.rules", message: "Something is wrong.", ruleId: null }
        ]);
    });

    it("passes every other field through with a null rule id", () => {
        const title = getRuleErrorsFromSave(failure({ field: "title" }), step());
        const none = getRuleErrorsFromSave(failure({ field: null }), step());
        const strategy = getRuleErrorsFromSave(
            failure({ field: "config.assignment.strategy" }),
            step()
        );

        expect(title).toEqual([{ field: "title", message: "Something is wrong.", ruleId: null }]);
        expect(none).toEqual([{ field: "", message: "Something is wrong.", ruleId: null }]);
        expect(strategy[0].ruleId).toBeNull();
    });
});

describe("getStepErrorTab (R302)", () => {
    const error = (field: string) => {
        return { field, message: "Wrong.", ruleId: null };
    };

    it("sends rule and assignment fields to the Assignment tab", () => {
        expect(getStepErrorTab([error("config.assignment.rules.target")])).toBe("assignment");
        expect(getStepErrorTab([error("config.assignment.strategy")])).toBe("assignment");
        expect(getStepErrorTab([error("config.assignment.allowManualPick")])).toBe("assignment");
    });

    it("sends the other fields that have a form field to the General tab", () => {
        for (const field of [
            "title",
            "color",
            "notifications",
            "config.teams",
            "config.teams.0",
            "config.automationId",
            "config.settings.url",
            "config.instructions",
            "config.model",
            "config.tools"
        ]) {
            expect(getStepErrorTab([error(field)])).toBe("general");
        }
    });

    it("names no tab for an error shown at the top and for no error", () => {
        expect(getStepErrorTab([error("")])).toBeNull();
        expect(getStepErrorTab([error("id")])).toBeNull();
        expect(getStepErrorTab([error("config.settings")])).toBeNull();
        expect(getStepErrorTab([error("config.assignment")])).toBeNull();
        expect(getStepErrorTab([error("config.assignment.somethingElse")])).toBeNull();
        expect(getStepErrorTab([])).toBeNull();
    });

    it("takes the tab of the first error that has one", () => {
        expect(getStepErrorTab([error(""), error("config.assignment.rules.target")])).toBe(
            "assignment"
        );
        expect(getStepErrorTab([error("title"), error("config.assignment.rules.target")])).toBe(
            "general"
        );
    });
});

describe("getRuleErrorField (R303)", () => {
    it("names the rule field of a normalised path", () => {
        expect(getRuleErrorField("config.assignment.rules.target")).toBe("target");
        expect(getRuleErrorField("config.assignment.rules.target.id")).toBe("target");
        expect(getRuleErrorField("config.assignment.rules.target.type")).toBe("target");
        expect(getRuleErrorField("config.assignment.rules.conditions.requesterUserId")).toBe(
            "requesterUser"
        );
        expect(getRuleErrorField("config.assignment.rules.conditions.requesterTeamId")).toBe(
            "requesterTeam"
        );
        expect(getRuleErrorField("config.assignment.rules.conditions.folder")).toBe("folder");
        expect(getRuleErrorField("config.assignment.rules.conditions.folder.id")).toBe("folder");
        expect(
            getRuleErrorField("config.assignment.rules.conditions.folder.includeDescendants")
        ).toBe("folder");
    });

    it("is null for the card itself and for paths it does not know", () => {
        expect(getRuleErrorField("config.assignment.rules")).toBeNull();
        expect(getRuleErrorField("config.assignment.rules.id")).toBeNull();
        expect(getRuleErrorField("config.assignment.rules.conditions.modelId")).toBeNull();
        expect(getRuleErrorField("title")).toBeNull();
    });
});

describe("getStepRuleIds", () => {
    it("lists the stored rule ids in order, one entry per rule", () => {
        expect(getStepRuleIds(step())).toEqual(["r-a", "r-b", "r-c"]);
    });

    it("keeps the positions of rules without an id and is empty for other steps", () => {
        const odd = createRoutingStep([createStoredRule({ id: "r-a" }), { target: null }]);

        expect(getStepRuleIds(odd)).toEqual(["r-a", ""]);
        expect(getStepRuleIds(createAiStep())).toEqual([]);
    });
});
