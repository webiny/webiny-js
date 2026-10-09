import { describe, expect, it } from "vitest";
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import type { WorkflowValues } from "~/domain/workflow/types.js";
import {
    createReviewStep,
    createWorkflowValues,
    OTHER_TEAM_ID,
    REVIEW_TEAM_ID
} from "~tests/__helpers/fixtures.js";

const validationMessage = (values: WorkflowValues): string => {
    const result = WorkflowValidator.validate(values);
    if (result.isOk()) {
        throw new Error("Expected the workflow to be invalid.");
    }
    expect(result.error.code).toBe("Workflows/Workflow/Validation");
    return result.error.message;
};

describe("WorkflowValidator", () => {
    it("accepts a workflow with review steps", () => {
        const values = createWorkflowValues();

        const result = WorkflowValidator.validate(values);

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(values);
    });

    it("requires a name", () => {
        expect(validationMessage(createWorkflowValues({ name: "  " }))).toBe(
            "Workflow name is required."
        );
    });

    it("requires exactly one model", () => {
        const expected = "A workflow must be bound to exactly one model.";
        expect(validationMessage(createWorkflowValues({ models: [] }))).toBe(expected);
        expect(validationMessage(createWorkflowValues({ models: ["cms.a", "cms.b"] }))).toBe(
            expected
        );
    });

    it("accepts only cms.<modelId> and wb.page namespace ids", () => {
        expect(validationMessage(createWorkflowValues({ models: ["foo"] }))).toBe(
            'Model "foo" is not a valid model ID. Use "cms.<modelId>" or "wb.page".'
        );
        expect(validationMessage(createWorkflowValues({ models: ["cms."] }))).toBe(
            'Model "cms." is not a valid model ID. Use "cms.<modelId>" or "wb.page".'
        );
        expect(validationMessage(createWorkflowValues({ models: ["wb.block"] }))).toBe(
            'Model "wb.block" is not a valid model ID. Use "cms.<modelId>" or "wb.page".'
        );
        expect(
            WorkflowValidator.validate(createWorkflowValues({ models: ["wb.page"] })).isOk()
        ).toBe(true);
    });

    it("requires at least one step", () => {
        expect(validationMessage(createWorkflowValues({ steps: [] }))).toBe(
            "Add at least one step."
        );
    });

    it("requires unique step ids", () => {
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "legal", title: "Second legal review" })
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step ID "legal" is used more than once.'
        );
    });

    it("accepts only review steps until step types are pluggable", () => {
        const steps = [{ ...createReviewStep({ id: "ai", title: "AI check" }), type: "ai" }];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step "AI check" uses the step type "ai", which is not supported yet. Only "review" steps can be saved.'
        );
    });

    it("requires at least one team on a review step", () => {
        const steps = [createReviewStep({ id: "legal", title: "Legal review", teams: [] })];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step "Legal review" needs at least one team.'
        );
    });

    it("requires a target on every routing rule", () => {
        const steps = [
            createReviewStep({
                id: "legal",
                title: "Legal review",
                rules: [{ id: "rule-1", conditions: {} }]
            })
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Every routing rule in step "Legal review" needs a target.'
        );
    });

    it("requires a team target to be one of the step's teams", () => {
        const steps = [
            createReviewStep({
                id: "legal",
                title: "Legal review",
                teams: [REVIEW_TEAM_ID],
                rules: [
                    {
                        id: "rule-1",
                        conditions: {},
                        target: { type: "team", id: OTHER_TEAM_ID }
                    }
                ]
            })
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Routing rule "rule-1" in step "Legal review" targets a team that is not one of the step\'s teams.'
        );
    });

    it("accepts a team target that is one of the step's teams and any user target", () => {
        const steps = [
            createReviewStep({
                id: "legal",
                title: "Legal review",
                teams: [REVIEW_TEAM_ID],
                rules: [
                    { id: "rule-1", conditions: {}, target: { type: "team", id: REVIEW_TEAM_ID } },
                    { id: "rule-2", conditions: {}, target: { type: "user", id: "user-anyone" } }
                ]
            })
        ];

        expect(WorkflowValidator.validate(createWorkflowValues({ steps })).isOk()).toBe(true);
    });

    it("rejects an invalid review config", () => {
        const step = createReviewStep({ id: "legal", title: "Legal review" });
        const steps = [
            {
                ...step,
                config: {
                    teams: ["team-a"],
                    assignment: { strategy: "random", allowManualPick: false, rules: [] }
                }
            }
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toMatch(
            /^Step "Legal review" has an invalid configuration: /
        );
    });
});
