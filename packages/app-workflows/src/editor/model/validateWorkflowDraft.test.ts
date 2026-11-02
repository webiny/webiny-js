import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createAssignmentValue } from "~/editor/testing/ruleFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { assignmentToConfig } from "./assignment/assignmentToConfig.js";
import type { RuleValue } from "./assignment/RuleValue.js";
import { createEmptyRuleReferences } from "./rules/createEmptyRuleReferences.js";
import { toStepInput } from "./toStepInput.js";
import { validateWorkflowDraft } from "./validateWorkflowDraft.js";
import type { ValidateWorkflowDraftParams } from "./validateWorkflowDraft.js";
import { WorkflowDraft } from "./WorkflowDraft.js";

const params = (
    overrides: Partial<ValidateWorkflowDraftParams> = {}
): ValidateWorkflowDraftParams => {
    return {
        name: "Article review",
        steps: [createReviewStep()],
        automations: [createWebhookAutomation()],
        aiEditable: true,
        references: createEmptyRuleReferences(),
        reviewAvailable: true,
        baselineSteps: [],
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
                errors: [{ field: "title", message: "Enter a title for this step.", ruleId: null }]
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
            { field: "color", message: "Enter a hex colour, e.g. #3B6FD4.", ruleId: null }
        ]);
        expect(hex.stepErrors).toEqual([]);
        expect(preset.stepErrors).toEqual([]);
        expect(empty.stepErrors).toEqual([]);
    });

    it("keeps a loaded colour that is not #RRGGBB and flags it once changed to an invalid hex", () => {
        const loaded = createReviewStep({ color: "#fff" });
        const unchanged = validateWorkflowDraft(
            params({ steps: [loaded], baselineSteps: [loaded] })
        );
        const changed = validateWorkflowDraft(
            params({ steps: [createReviewStep({ color: "#12" })], baselineSteps: [loaded] })
        );

        expect(unchanged.stepErrors).toEqual([]);
        expect(changed.stepErrors[0].errors).toEqual([
            { field: "color", message: "Enter a hex colour, e.g. #3B6FD4.", ruleId: null }
        ]);
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
            { field: "config.teams", message: "Choose at least one reviewing team.", ruleId: null }
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
            { field: "config.settings.url", message: "URL is required.", ruleId: null }
        ]);
    });

    it("names a required setting that is missing", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: {} }
        });

        const errors = validateWorkflowDraft(params({ steps: [step] }));

        expect(errors.stepErrors[0].errors).toEqual([
            { field: "config.settings.url", message: "URL is required.", ruleId: null }
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
            { field: "config.settings.endpoint", message: "endpoint is required.", ruleId: null }
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
            {
                field: "config.instructions",
                message: "Enter instructions for the AI.",
                ruleId: null
            },
            { field: "config.model", message: "Choose an AI model.", ruleId: null }
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

const RULE_TARGET_FIELD = "config.assignment.rules.target";

const references = createRuleReferences({
    users: [
        createReferenceLabel({ id: "user-in", label: "Ivan Horvat" }),
        createReferenceLabel({ id: "user-out", label: "Maja Kos" }),
        createReferenceLabel({ id: "user-gone", label: "Deleted user", state: "deleted" })
    ],
    teams: [
        createReferenceLabel({ id: "team-1", label: "Editors" }),
        createReferenceLabel({ id: "team-2", label: "Marketing" }),
        createReferenceLabel({ id: "team-gone", label: "Deleted team", state: "deleted" })
    ],
    folders: [
        createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" }),
        createReferenceLabel({ id: "fx", label: "Deleted folder", state: "deleted" })
    ],
    userTeamIds: { "user-in": ["team-1"], "user-out": ["team-7"] }
});

const stepWithRules = (rules: RuleValue[], teams: string[] = ["team-1"]): EditorStep => {
    const assignment = assignmentToConfig(createAssignmentValue({ rules }));

    return createReviewStep({ config: { teams, assignment } });
};

describe("validateWorkflowDraft: People rules (R299, R304)", () => {
    it("blocks a rule without a target and names the rule", () => {
        const step = stepWithRules([createRuleValue({ id: "a", target: null })]);

        const errors = validateWorkflowDraft(params({ steps: [step], references }));

        expect(errors.stepErrors).toEqual([
            {
                stepId: "step-1",
                errors: [
                    {
                        field: RULE_TARGET_FIELD,
                        message: "Choose who this rule assigns to.",
                        ruleId: "a"
                    }
                ]
            }
        ]);
    });

    it("blocks a user target outside the reviewing teams", () => {
        const rule = createRuleValue({ id: "a", target: { type: "user", id: "user-out" } });

        const errors = validateWorkflowDraft(
            params({ steps: [stepWithRules([rule])], references })
        );

        expect(errors.stepErrors[0].errors).toEqual([
            {
                field: RULE_TARGET_FIELD,
                message: "Maja Kos is no longer in the reviewing teams.",
                ruleId: "a"
            }
        ]);
    });

    it("blocks a team target outside the reviewing teams", () => {
        const rule = createRuleValue({ id: "a", target: { type: "team", id: "team-2" } });

        const errors = validateWorkflowDraft(
            params({ steps: [stepWithRules([rule])], references })
        );

        expect(errors.stepErrors[0].errors).toEqual([
            {
                field: RULE_TARGET_FIELD,
                message: "Marketing is not a reviewing team.",
                ruleId: "a"
            }
        ]);
    });

    it("blocks a deleted user target and a deleted team target", () => {
        const rules = [
            createRuleValue({ id: "a", target: { type: "user", id: "user-gone" } }),
            createRuleValue({ id: "b", target: { type: "team", id: "team-gone" } })
        ];

        const errors = validateWorkflowDraft(params({ steps: [stepWithRules(rules)], references }));

        expect(errors.stepErrors[0].errors).toEqual([
            {
                field: RULE_TARGET_FIELD,
                message: "The assigned user was deleted.",
                ruleId: "a"
            },
            { field: RULE_TARGET_FIELD, message: "The team was deleted.", ruleId: "b" }
        ]);
    });

    it("lists the missing teams error before the rule errors", () => {
        const rule = createRuleValue({ id: "a", target: null });

        const errors = validateWorkflowDraft(
            params({ steps: [stepWithRules([rule], [])], references })
        );

        expect(errors.stepErrors[0].errors.map(error => error.field)).toEqual([
            "config.teams",
            RULE_TARGET_FIELD
        ]);
        expect(errors.stepErrors[0].errors[0].ruleId).toBeNull();
    });

    it("does not block Save on warnings: a deleted folder, a deleted requester team, a restricted folder and a deleted requester user", () => {
        const rules = [
            createRuleValue({
                id: "a",
                folder: { id: "fx", type: "cms:article", includeDescendants: true }
            }),
            createRuleValue({ id: "b", requesterTeamId: "team-gone" }),
            createRuleValue({
                id: "c",
                folder: { id: "f9", type: "cms:article", includeDescendants: false }
            }),
            createRuleValue({ id: "d", requesterUserId: "user-gone" })
        ];

        const errors = validateWorkflowDraft(params({ steps: [stepWithRules(rules)], references }));

        expect(errors.stepErrors).toEqual([]);
    });

    it("does not block a valid rule list", () => {
        const rules = [
            createRuleValue({ id: "a", target: { type: "user", id: "user-in" } }),
            createRuleValue({ id: "b", target: { type: "team", id: "team-1" } })
        ];

        const errors = validateWorkflowDraft(params({ steps: [stepWithRules(rules)], references }));

        expect(errors.stepErrors).toEqual([]);
    });

    it("does not block on a reference that is not resolved", () => {
        const rule = createRuleValue({ id: "a", target: { type: "user", id: "user-unknown" } });

        const errors = validateWorkflowDraft(
            params({ steps: [stepWithRules([rule])], references: createEmptyRuleReferences() })
        );

        expect(errors.stepErrors).toEqual([]);
    });
});

describe("validateWorkflowDraft: teams off (R290, R304, Review Focus 5)", () => {
    const staleRules = [
        createRuleValue({
            id: "a",
            folder: { id: "fx", type: "cms:article", includeDescendants: true },
            target: { type: "user", id: "user-gone" }
        }),
        createRuleValue({ id: "b", target: { type: "team", id: "team-gone" } }),
        createRuleValue({ id: "c", target: null })
    ];

    it("never blocks Save for a People step while the review type is unavailable", () => {
        const errors = validateWorkflowDraft(
            params({
                steps: [stepWithRules(staleRules), stepWithRules([], [])],
                references,
                reviewAvailable: false
            })
        );

        expect(errors).toEqual({ name: null, steps: null, stepErrors: [] });
    });

    it("saves a People step with a user target, a team target and a deleted folder unchanged", () => {
        const stored = createReviewStep({
            config: {
                teams: ["team-1"],
                assignment: {
                    strategy: "roundRobin",
                    allowManualPick: true,
                    rules: [
                        {
                            id: "r1",
                            conditions: {
                                folder: { id: "fx", type: "cms:article", includeDescendants: true }
                            },
                            target: { type: "user", id: "user-9" }
                        },
                        { id: "r2", conditions: {}, target: { type: "team", id: "team-9" } }
                    ]
                }
            }
        });
        const draft = new WorkflowDraft();
        draft.reset(createEditorWorkflow({ steps: [stored] }));

        const errors = validateWorkflowDraft(
            params({ steps: draft.steps, references, reviewAvailable: false })
        );

        expect(errors.stepErrors).toEqual([]);
        expect(draft.toInput().steps[0]).toEqual(toStepInput(stored));
        expect(draft.toInput().steps[0].config).toEqual(stored.config);
    });

    it("keeps the shared checks and the other step types working", () => {
        const errors = validateWorkflowDraft(
            params({
                steps: [
                    createReviewStep({ title: " " }),
                    createAutomationStep({
                        config: { automationId: "send-webhook", settings: {} }
                    }),
                    createAiStep({
                        config: { instructions: "", model: "openai/gpt-4o", tools: [] }
                    })
                ],
                references,
                reviewAvailable: false
            })
        );

        expect(errors.stepErrors.map(entry => entry.stepId)).toEqual([
            "step-1",
            "step-2",
            "step-3"
        ]);
        expect(errors.stepErrors[0].errors.map(error => error.field)).toEqual(["title"]);
        expect(errors.stepErrors[1].errors.map(error => error.field)).toEqual([
            "config.settings.url"
        ]);
        expect(errors.stepErrors[2].errors.map(error => error.field)).toEqual([
            "config.instructions"
        ]);
    });
});
