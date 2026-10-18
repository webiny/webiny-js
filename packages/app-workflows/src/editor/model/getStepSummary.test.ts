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
import { getStepSummary } from "./getStepSummary.js";
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
        aiTools: [],
        aiEditable: true,
        baselineStep: null,
        ...overrides
    };
};

describe("getStepSummary: People", () => {
    it("joins the team names with +", () => {
        const step = createReviewStep({
            config: { teams: ["team-2", "team-1"], assignment: null }
        });

        expect(getStepSummary(step, context())).toBe("Editors + Legal");
    });

    it("names a team that is not known as Unknown item", () => {
        const step = createReviewStep({ config: { teams: ["team-1", "gone"], assignment: null } });

        expect(getStepSummary(step, context())).toBe("Legal + Unknown item");
    });

    it("is empty without a team", () => {
        const step = createReviewStep({ config: { teams: [], assignment: null } });

        expect(getStepSummary(step, context())).toBe("");
    });
});

describe("getStepSummary: Automation", () => {
    it("shows the automation's name", () => {
        expect(getStepSummary(createAutomationStep(), context())).toBe("Send webhook");
    });

    it("shows the id when the definition is not listed", () => {
        const step = createAutomationStep({ config: { automationId: "gone", settings: {} } });

        expect(getStepSummary(step, context())).toBe("gone");
    });

    it("is empty before an automation is chosen", () => {
        const step = createAutomationStep({ config: { automationId: "", settings: {} } });

        expect(getStepSummary(step, context())).toBe("");
    });
});

describe("getStepSummary: AI", () => {
    it("shows the model and the tool count with the right plural", () => {
        const one = createAiStep({
            config: { instructions: "i", model: "openai/gpt-4o", tools: ["a"] }
        });
        const three = createAiStep({
            config: { instructions: "i", model: "openai/gpt-4o", tools: ["a", "b", "c"] }
        });
        const none = createAiStep({
            config: { instructions: "i", model: "openai/gpt-4o", tools: [] }
        });

        expect(getStepSummary(one, context())).toBe("GPT-4o · 1 tool");
        expect(getStepSummary(three, context())).toBe("GPT-4o · 3 tools");
        expect(getStepSummary(none, context())).toBe("GPT-4o · 0 tools");
    });

    it("says no model chosen for a step without a model (QBZ-89)", () => {
        const step = createAiStep({ config: { instructions: "i", model: "", tools: [] } });

        expect(getStepSummary(step, context())).toBe("No model chosen · 0 tools");
    });

    it("marks a retired model with its id as the name (QBZ-8)", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: ["a", "b"] }
        });

        expect(getStepSummary(step, context())).toBe(
            "openai/old-model (no longer offered) · 2 tools"
        );
    });

    it("cannot tell a retired model without a loaded, non-empty list", () => {
        const step = createAiStep({
            config: { instructions: "i", model: "openai/old-model", tools: [] }
        });

        expect(getStepSummary(step, context({ aiModels: null }))).toBe(
            "openai/old-model · 0 tools"
        );
        expect(getStepSummary(step, context({ aiModels: [] }))).toBe("openai/old-model · 0 tools");
    });
});

describe("getStepSummary: AI tools that change content (R283)", () => {
    const reader = createAiTool({ name: "readContent", changesContent: false });
    const writer = createAiTool({ name: "updateFields", changesContent: true });
    const withTools = (tools: string[], model = "openai/gpt-4o") => {
        return createAiStep({ config: { instructions: "i", model, tools } });
    };

    it("appends can change content when a chosen tool changes content", () => {
        const step = withTools(["readContent", "updateFields"]);

        expect(getStepSummary(step, context({ aiTools: [reader, writer] }))).toBe(
            "GPT-4o · 2 tools · can change content"
        );
    });

    it("does not when no chosen tool changes content", () => {
        const step = withTools(["readContent"]);

        expect(getStepSummary(step, context({ aiTools: [reader, writer] }))).toBe(
            "GPT-4o · 1 tool"
        );
    });

    it("ignores a kept tool name no tool lists", () => {
        const step = withTools(["gone-tool"]);

        expect(getStepSummary(step, context({ aiTools: [reader, writer] }))).toBe(
            "GPT-4o · 1 tool"
        );
    });

    it("never appends while the tool list is not loaded or is empty", () => {
        const step = withTools(["updateFields"]);

        expect(getStepSummary(step, context({ aiTools: null }))).toBe("GPT-4o · 1 tool");
        expect(getStepSummary(step, context({ aiTools: [] }))).toBe("GPT-4o · 1 tool");
    });

    it("appends to the retired model and the no model forms too", () => {
        const retired = withTools(["readContent", "updateFields"], "openai/old-model");
        const none = withTools(["updateFields"], "");
        const tools = [reader, writer];

        expect(getStepSummary(retired, context({ aiTools: tools }))).toBe(
            "openai/old-model (no longer offered) · 2 tools · can change content"
        );
        expect(getStepSummary(none, context({ aiTools: tools }))).toBe(
            "No model chosen · 1 tool · can change content"
        );
    });
});

describe("getStepSummary: unknown type", () => {
    it("is empty", () => {
        const step = createReviewStep({ type: "custom", config: {} });

        expect(getStepSummary(step, context())).toBe("");
    });
});
