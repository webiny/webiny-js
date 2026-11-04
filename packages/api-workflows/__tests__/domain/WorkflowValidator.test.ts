import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import {
    WorkflowValidator,
    type WorkflowStepValidator
} from "~/domain/workflow/WorkflowValidator.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import { createReviewStep, createWorkflowValues } from "~tests/__helpers/fixtures.js";

/** Accepts every step as it is; the step type checks are tested with the step types. */
const acceptStep: WorkflowStepValidator = step => {
    return Result.ok(step);
};

/** The models the tests' apps know. */
const KNOWN_MODELS = ["cms.article", "cms.a", "cms.b", "wb.page"];

const isKnownModel = (model: string): boolean => {
    return KNOWN_MODELS.includes(model);
};

const validationMessage = (
    values: WorkflowValues,
    validateStep: WorkflowStepValidator = acceptStep
): string => {
    const result = WorkflowValidator.validate(values, validateStep, isKnownModel);
    if (result.isOk()) {
        throw new Error("Expected the workflow to be invalid.");
    }
    expect(result.error.code).toBe("Workflows/Workflow/Validation");
    return result.error.message;
};

describe("WorkflowValidator", () => {
    it("accepts a workflow whose steps the step validator accepts", () => {
        const values = createWorkflowValues();

        const result = WorkflowValidator.validate(values, acceptStep, isKnownModel);

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

    it("accepts only a model an app knows", () => {
        expect(validationMessage(createWorkflowValues({ models: ["foo"] }))).toBe(
            'Model "foo" is not supported.'
        );
        expect(validationMessage(createWorkflowValues({ models: ["wb.block"] }))).toBe(
            'Model "wb.block" is not supported.'
        );
        expect(
            WorkflowValidator.validate(
                createWorkflowValues({ models: ["wb.page"] }),
                acceptStep,
                isKnownModel
            ).isOk()
        ).toBe(true);
    });

    it("requires at least one step", () => {
        expect(validationMessage(createWorkflowValues({ steps: [] }))).toBe(
            "Add at least one step."
        );
    });

    it("requires a step id and a title", () => {
        const withoutId = [{ ...createReviewStep({ id: "legal", title: "Legal" }), id: "" }];
        const withoutTitle = [createReviewStep({ id: "legal", title: " " })];

        expect(validationMessage(createWorkflowValues({ steps: withoutId }))).toBe(
            "Every step needs an ID."
        );
        expect(validationMessage(createWorkflowValues({ steps: withoutTitle }))).toBe(
            'Step "legal" needs a title.'
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

    it("calls the step validator once per step, in order, after the structural checks", () => {
        const seen: string[] = [];
        const validateStep: WorkflowStepValidator = step => {
            seen.push(step.id);
            return Result.ok(step);
        };
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ];

        WorkflowValidator.validate(createWorkflowValues({ steps }), validateStep, isKnownModel);
        expect(seen).toEqual(["legal", "editorial"]);

        seen.length = 0;
        const duplicate = [steps[0], { ...steps[1], id: "legal" }];
        validationMessage(createWorkflowValues({ steps: duplicate }), validateStep);
        expect(seen).toEqual(["legal"]);
    });

    it("returns the step validator's error", () => {
        const validateStep: WorkflowStepValidator = step => {
            return Result.fail(new WorkflowValidationError(`Step "${step.title}" is not valid.`));
        };

        expect(validationMessage(createWorkflowValues(), validateStep)).toBe(
            'Step "Legal review" is not valid.'
        );
    });

    it("normalises the returned step: color, trimmed description, notifications, config", () => {
        const validateStep: WorkflowStepValidator = step => {
            return Result.ok({ ...step, config: { normalised: true } });
        };
        const [first, second] = [
            {
                ...createReviewStep({ id: "legal", title: "Legal review" }),
                description: "  Check the legal side  ",
                notifications: undefined as unknown as WorkflowStep["notifications"]
            },
            {
                ...createReviewStep({ id: "editorial", title: "Editorial review" }),
                description: "   ",
                color: undefined as unknown as string
            }
        ];

        const result = WorkflowValidator.validate(
            createWorkflowValues({ steps: [first, second] }),
            validateStep,
            isKnownModel
        );

        expect(result.value?.steps[0].description).toBe("Check the legal side");
        expect(result.value?.steps[0].notifications).toEqual([]);
        expect(result.value?.steps[0].config).toEqual({ normalised: true });
        expect(result.value?.steps[1]).not.toHaveProperty("description");
        expect(result.value?.steps[1].color).toBe("");
    });
});
