import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createAssignmentValue } from "~/editor/testing/ruleFixtures.js";
import { assignmentToConfig } from "./assignment/assignmentToConfig.js";
import { getStepDetails } from "./getStepDetails.js";
import { createEmptyRuleReferences } from "./rules/createEmptyRuleReferences.js";
import type { StepContext } from "./StepContext.js";

const context = (overrides: Partial<StepContext> = {}): StepContext => {
    return {
        teams: [
            createWorkflowTeamSummary({ id: "team-1", name: "Legal" }),
            createWorkflowTeamSummary({ id: "team-2", name: "Editors" })
        ],
        automations: [createWebhookAutomation()],
        automationsLoaded: true,
        aiModels: [createAiModel()],
        aiTools: [createAiTool()],
        aiEditable: true,
        baselineStep: null,
        references: createEmptyRuleReferences(),
        reviewAvailable: true,
        ...overrides
    };
};

describe("getStepDetails", () => {
    it("lists the reviewing teams and the assignment of a People step", () => {
        const assignment = assignmentToConfig(createAssignmentValue({ strategy: "roundRobin" }));
        const step = createReviewStep({ config: { teams: ["team-2", "team-1"], assignment } });

        expect(getStepDetails(step, context())).toEqual([
            { label: "Reviewing teams", value: "Editors, Legal" },
            { label: "Assignment", value: "Round-robin" }
        ]);
    });

    it("has no rows for a People step without a team or while teams are off", () => {
        const empty = createReviewStep({ config: { teams: [], assignment: null } });
        const step = createReviewStep({ config: { teams: ["team-1"], assignment: null } });

        expect(getStepDetails(empty, context())).toEqual([]);
        expect(getStepDetails(step, context({ reviewAvailable: false }))).toEqual([]);
    });

    it("lists the model and the tools of an AI step", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/gpt-4o", tools: ["readContent", "gone"] }
        });

        expect(getStepDetails(step, context())).toEqual([
            { label: "Model", value: "GPT-4o" },
            { label: "Tools", value: "Read content, gone" }
        ]);
    });

    it("lists the automation, and the key setting only when the settings hold one", () => {
        const plain = createAutomationStep({
            config: { automationId: "send-webhook", settings: {} }
        });
        const withUrl = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: "https://hooks.example/x" } }
        });

        expect(getStepDetails(plain, context())).toEqual([
            { label: "Automation", value: "Send webhook" }
        ]);
        expect(getStepDetails(withUrl, context())).toEqual([
            { label: "Automation", value: "Send webhook" },
            { label: "URL", value: "https://hooks.example/x" }
        ]);
    });

    it("labels the key setting with its schema title, falling back to the key name", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: { timeout: 30, mode: "fast" } }
        });
        const titled = createWebhookAutomation({ keySetting: "timeout" });
        const untitled = createWebhookAutomation({ keySetting: "mode" });

        expect(getStepDetails(step, context({ automations: [titled] }))).toEqual([
            { label: "Automation", value: "Send webhook" },
            { label: "Timeout (seconds)", value: "30" }
        ]);
        expect(getStepDetails(step, context({ automations: [untitled] }))).toEqual([
            { label: "Automation", value: "Send webhook" },
            { label: "mode", value: "fast" }
        ]);
    });

    it("shows booleans and arrays of scalars, and no row for other values", () => {
        const make = (value: unknown) => {
            return getStepDetails(
                createAutomationStep({
                    config: { automationId: "send-webhook", settings: { flag: value } }
                }),
                context({ automations: [createWebhookAutomation({ keySetting: "flag" })] })
            );
        };

        expect(make(false)).toEqual([
            { label: "Automation", value: "Send webhook" },
            { label: "flag", value: "false" }
        ]);
        expect(make(["a", 2, true])).toEqual([
            { label: "Automation", value: "Send webhook" },
            { label: "flag", value: "a, 2, true" }
        ]);
        expect(make({ nested: 1 })).toEqual([{ label: "Automation", value: "Send webhook" }]);
        expect(make(undefined)).toEqual([{ label: "Automation", value: "Send webhook" }]);
        expect(make("")).toEqual([{ label: "Automation", value: "Send webhook" }]);
    });

    it("shows no key row when the definition has no key setting", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: "https://hooks.example/x" } }
        });

        expect(
            getStepDetails(
                step,
                context({ automations: [createWebhookAutomation({ keySetting: null })] })
            )
        ).toEqual([{ label: "Automation", value: "Send webhook" }]);
    });
});
