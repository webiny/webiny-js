import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { getStepWarnings } from "./getStepWarnings.js";
import type { StepContext } from "./StepContext.js";

const context = (overrides: Partial<StepContext> = {}): StepContext => {
    return {
        teams: [createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 3 })],
        automations: [createWebhookAutomation()],
        automationsLoaded: true,
        aiModels: [createAiModel()],
        aiTools: [],
        aiEditable: true,
        baselineStep: null,
        ...overrides
    };
};

describe("getStepWarnings: People", () => {
    it("is clean when every team has members", () => {
        expect(getStepWarnings(createReviewStep(), context())).toEqual([]);
    });

    it("names each known team without members", () => {
        const step = createReviewStep({
            config: { teams: ["team-1", "team-2", "team-3"], assignment: null }
        });
        const teams = [
            createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 0 }),
            createWorkflowTeamSummary({ id: "team-2", name: "Editors", memberCount: 2 }),
            createWorkflowTeamSummary({ id: "team-3", name: "Press", memberCount: 0 })
        ];

        expect(getStepWarnings(step, context({ teams }))).toEqual([
            "Legal has no members.",
            "Press has no members."
        ]);
    });

    it("does not warn about a team that is not known", () => {
        const step = createReviewStep({ config: { teams: ["gone"], assignment: null } });

        expect(getStepWarnings(step, context())).toEqual([]);
    });
});

describe("getStepWarnings: Automation", () => {
    it("is clean for a listed automation with valid settings", () => {
        expect(getStepWarnings(createAutomationStep(), context())).toEqual([]);
    });

    it("warns when the stored automation no longer exists", () => {
        const step = createAutomationStep({ config: { automationId: "gone", settings: {} } });

        expect(getStepWarnings(step, context())).toEqual([
            "The automation “gone” no longer exists."
        ]);
    });

    it("does not call an automation gone while the list did not load", () => {
        const step = createAutomationStep({ config: { automationId: "gone", settings: {} } });

        expect(
            getStepWarnings(step, context({ automationsLoaded: false, automations: [] }))
        ).toEqual([]);
    });

    it("does not warn before an automation is chosen", () => {
        const step = createAutomationStep({ config: { automationId: "", settings: {} } });

        expect(getStepWarnings(step, context())).toEqual([]);
    });

    it("warns that saved settings no longer validate when they are unchanged (QBZ-13)", () => {
        const stored = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 5 } }
        });

        const warnings = getStepWarnings(stored, context({ baselineStep: stored }));

        expect(warnings).toHaveLength(1);
        expect(warnings[0].startsWith("Saved settings no longer validate: ")).toBe(true);
        expect(warnings[0].length).toBeGreaterThan("Saved settings no longer validate: ".length);
    });

    it("says nothing once the admin changed the settings in this session (QBZ-13)", () => {
        const stored = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 5 } }
        });
        const edited = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 6 } }
        });

        expect(getStepWarnings(edited, context({ baselineStep: stored }))).toEqual([]);
    });

    it("says nothing about the settings of a step that is not on the server yet", () => {
        const step = createAutomationStep({
            config: { automationId: "send-webhook", settings: { url: 5 } }
        });

        expect(getStepWarnings(step, context({ baselineStep: null }))).toEqual([]);
    });

    it("says nothing when the stored settings still validate", () => {
        const stored = createAutomationStep();

        expect(getStepWarnings(stored, context({ baselineStep: stored }))).toEqual([]);
    });
});

describe("getStepWarnings: AI", () => {
    it("is clean for an offered model", () => {
        expect(getStepWarnings(createAiStep(), context())).toEqual([]);
    });

    it("warns about the licence when the AI editor does not exist, and only that", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });

        expect(getStepWarnings(step, context({ aiEditable: false, aiModels: null }))).toEqual([
            "AI Power-Ups licence missing. This step fails when reached and can be restarted once the licence is back."
        ]);
    });

    it("warns about a retired model (QBZ-8)", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });

        expect(getStepWarnings(step, context())).toEqual([
            "The AI model “openai/old-model” is no longer offered. Choose another model; until then this step fails when reached."
        ]);
    });

    it("does not call a model retired without a loaded, non-empty list, or before one is chosen", () => {
        const stored = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });
        const fresh = createAiStep({ config: { instructions: "", model: "", tools: [] } });

        expect(getStepWarnings(stored, context({ aiModels: null }))).toEqual([]);
        expect(getStepWarnings(stored, context({ aiModels: [] }))).toEqual([]);
        expect(getStepWarnings(fresh, context())).toEqual([]);
    });
});

describe("getStepWarnings: unknown type", () => {
    it("has none", () => {
        const step = createReviewStep({ type: "custom", config: {} });

        expect(getStepWarnings(step, context())).toEqual([]);
    });
});
