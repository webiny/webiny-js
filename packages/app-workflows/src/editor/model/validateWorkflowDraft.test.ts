import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { validateWorkflowDraft } from "./validateWorkflowDraft.js";
import type { ValidateWorkflowDraftParams } from "./validateWorkflowDraft.js";

const params = (
    overrides: Partial<ValidateWorkflowDraftParams> = {}
): ValidateWorkflowDraftParams => {
    return {
        name: "Article review",
        steps: [createReviewStep()],
        automations: [createWebhookAutomation()],
        aiEditable: true,
        ...overrides
    };
};

describe("validateWorkflowDraft: the workflow", () => {
    it("is clean for a valid workflow", () => {
        expect(validateWorkflowDraft(params())).toEqual({
            name: null,
            steps: null,
            stepErrors: []
        });
    });

    it("needs a name", () => {
        expect(validateWorkflowDraft(params({ name: "" })).name).toBe("Enter a workflow name.");
        expect(validateWorkflowDraft(params({ name: "   " })).name).toBe("Enter a workflow name.");
    });

    it("needs at least one step", () => {
        const errors = validateWorkflowDraft(params({ steps: [] }));

        expect(errors.steps).toBe("Add at least one step.");
        expect(errors.stepErrors).toEqual([]);
    });
});

describe("validateWorkflowDraft: every step", () => {
    it("needs a title", () => {
        const errors = validateWorkflowDraft(params({ steps: [createReviewStep({ title: " " })] }));

        expect(errors.stepErrors).toEqual([
            {
                stepId: "step-1",
                errors: [{ field: "title", message: "Enter a title for this step." }]
            }
        ]);
    });

    it("refuses an invalid custom hex colour and accepts presets and a valid hex", () => {
        const invalid = validateWorkflowDraft(
            params({ steps: [createReviewStep({ color: "#3B6F" })] })
        );
        const hex = validateWorkflowDraft(
            params({ steps: [createReviewStep({ color: "#3B6FD4" })] })
        );
        const preset = validateWorkflowDraft(params());
        const empty = validateWorkflowDraft(params({ steps: [createReviewStep({ color: "" })] }));

        expect(invalid.stepErrors[0].errors).toEqual([
            { field: "color", message: "Enter a hex colour, e.g. #3B6FD4." }
        ]);
        expect(hex.stepErrors).toEqual([]);
        expect(preset.stepErrors).toEqual([]);
        expect(empty.stepErrors).toEqual([]);
    });

    it("lists the steps with errors in step order and skips the clean ones", () => {
        const errors = validateWorkflowDraft(
            params({
                steps: [
                    createReviewStep({ id: "a", title: "" }),
                    createReviewStep({ id: "b" }),
                    createReviewStep({ id: "c", title: "" })
                ]
            })
        );

        expect(errors.stepErrors.map(entry => entry.stepId)).toEqual(["a", "c"]);
    });
});

describe("validateWorkflowDraft: People step", () => {
    it("needs at least one reviewing team", () => {
        const step = createReviewStep({ config: { teams: [], assignment: null } });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.teams", message: "Choose at least one reviewing team." }
        ]);
    });
});

describe("validateWorkflowDraft: Automation step", () => {
    it("names a required setting that is empty, with the property's title", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: "" } }
        });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.settings.url", message: "URL is required." }
        ]);
    });

    it("names a required setting that is missing", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: {} }
        });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.settings.url", message: "URL is required." }
        ]);
    });

    it("falls back to the property key when the property has no title", () => {
        const automation = createWebhookAutomation({
            settingsSchema: {
                type: "object",
                properties: { endpoint: { type: "string" } },
                required: ["endpoint"]
            }
        });
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: {} }
        });

        const errors = validateWorkflowDraft(params({ steps: [step], automations: [automation] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.settings.endpoint", message: "endpoint is required." }
        ]);
    });

    it("does not call a setting with a default required", () => {
        const automation = createWebhookAutomation({
            settingsSchema: {
                type: "object",
                properties: { retries: { type: "number", title: "Retries", default: 3 } },
                required: ["retries"]
            }
        });
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: {} }
        });

        const errors = validateWorkflowDraft(params({ steps: [step], automations: [automation] }));

        expect(errors.stepErrors).toEqual([]);
    });

    it("reports another settings issue on its own path with the validator's message", () => {
        const step = createAutomationStep({
            config: {
                automationId: "send-webhook",
                settings: { url: "https://example.com/hook", timeout: 0 }
            }
        });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors).toHaveLength(1);
        const [issue] = errors.stepErrors[0].errors;
        expect(issue.field).toBe("config.settings.timeout");
        expect(issue.message).not.toBe("");
    });

    it("accepts valid settings", () => {
        const errors = validateWorkflowDraft(params({ steps: [createAutomationStep()] }));

        expect(errors.stepErrors).toEqual([]);
    });

    it("skips an automation that is not listed and one without a settings schema", () => {
        const missing = createAutomationStep({
            config: { automationId: "gone", settings: {} }
        });
        const noSchema = createAutomationStep({
            id: "step-4",
            config: { automationId: "plain", settings: {} }
        });
        const plain = createWebhookAutomation({ id: "plain", settingsSchema: null });

        const errors = validateWorkflowDraft(
            params({ steps: [missing, noSchema], automations: [plain] })
        );

        expect(errors.stepErrors).toEqual([]);
    });
});

describe("validateWorkflowDraft: AI step", () => {
    it("needs instructions and a model (QBZ-89)", () => {
        const step = createAiStep({ config: { instructions: " ", model: "", tools: [] } });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.instructions", message: "Enter instructions for the AI." },
            { field: "config.model", message: "Choose an AI model." }
        ]);
    });

    it("never blocks Save while the AI editor does not exist (QBZ-47)", () => {
        const step = createAiStep({ config: { instructions: "", model: "", tools: [] } });

        const errors = validateWorkflowDraft(params({ steps: [step], aiEditable: false }));

        expect(errors.stepErrors).toEqual([]);
    });
});

describe("validateWorkflowDraft: unknown types", () => {
    it("checks only the common fields", () => {
        const step = createReviewStep({ type: "custom", config: { anything: true } });

        expect(validateWorkflowDraft(params({ steps: [step] })).stepErrors).toEqual([]);
    });
});
