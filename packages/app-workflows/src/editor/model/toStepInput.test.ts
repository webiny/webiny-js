import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorStep } from "~/editor/testing/editorFixtures.js";
import { toStepInput } from "./toStepInput.js";

describe("toStepInput: common keys", () => {
    it("maps notification ids to objects and keeps ids no transport lists (D151)", () => {
        const input = toStepInput(
            createReviewStep({ notificationIds: ["e-mail", "retired-channel"] })
        );

        expect(input.notifications).toEqual([{ id: "e-mail" }, { id: "retired-channel" }]);
    });

    it("carries id, title, colour, description and type", () => {
        const input = toStepInput(
            createReviewStep({ id: "s", title: "T", color: "#3B6FD4", description: "D" })
        );

        expect(input).toMatchObject({
            id: "s",
            title: "T",
            color: "#3B6FD4",
            description: "D",
            type: "review"
        });
    });
});

describe("toStepInput: review config (R270)", () => {
    it("emits exactly teams and assignment", () => {
        const input = toStepInput(createReviewStep());

        expect(input.config).toEqual({
            teams: ["team-1"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("carries a stored assignment unchanged, with its rules", () => {
        const assignment = {
            strategy: "roundRobin",
            allowManualPick: true,
            rules: [
                {
                    id: "rule-1",
                    conditions: { requesterTeamId: "team-2" },
                    target: { type: "team", id: "team-1" }
                }
            ]
        };

        const input = toStepInput(createReviewStep({ config: { teams: ["team-1"], assignment } }));

        expect(input.config).toEqual({ teams: ["team-1"], assignment });
    });

    it("emits the review defaults for a step that has no assignment", () => {
        const input = toStepInput(createReviewStep({ config: { teams: ["team-1", "team-2"] } }));

        expect(input.config).toEqual({
            teams: ["team-1", "team-2"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("drops editor-only keys from the stored config", () => {
        const input = toStepInput(
            createReviewStep({
                config: { teams: ["team-1"], assignment: null, _templateId: "review", extra: 1 }
            })
        );

        expect(Object.keys(input.config as object).sort()).toEqual(["assignment", "teams"]);
    });
});

describe("toStepInput: automation config", () => {
    it("emits exactly automationId and settings", () => {
        const input = toStepInput(createAutomationStep());

        expect(input.config).toEqual({
            automationId: "send-webhook",
            settings: { url: "https://example.com/hook" }
        });
    });

    it("defaults settings to an empty object", () => {
        const input = toStepInput(
            createAutomationStep({ config: { automationId: "send-webhook" } })
        );

        expect(input.config).toEqual({ automationId: "send-webhook", settings: {} });
    });
});

describe("toStepInput: AI config", () => {
    it("emits exactly instructions, model and tools", () => {
        const input = toStepInput(createAiStep());

        expect(input.config).toEqual({
            instructions: "Check the tone of voice.",
            model: "openai/gpt-4o",
            tools: ["readContent"]
        });
    });

    it("keeps tool names no tool lists and defaults tools to an empty list", () => {
        const kept = toStepInput(
            createAiStep({ config: { instructions: "i", model: "m", tools: ["gone-tool"] } })
        );
        const defaulted = toStepInput(createAiStep({ config: { instructions: "i", model: "m" } }));

        expect((kept.config as { tools: string[] }).tools).toEqual(["gone-tool"]);
        expect((defaulted.config as { tools: string[] }).tools).toEqual([]);
    });
});

describe("toStepInput: unknown type", () => {
    it("keeps the stored config untouched", () => {
        const config = { anything: { nested: [1, 2, 3] } };

        const input = toStepInput(createEditorStep({ type: "custom", config }));

        expect(input.type).toBe("custom");
        expect(input.config).toBe(config);
    });
});
