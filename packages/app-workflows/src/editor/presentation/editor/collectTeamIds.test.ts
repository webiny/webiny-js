import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { collectTeamIds } from "./collectTeamIds.js";

const NOTIFY_TEAM = createAutomationDefinition({
    id: "notify-team",
    models: ["*"],
    settingsSchema: {
        type: "object",
        properties: { owner: { type: "string", ui: "team" }, note: { type: "string" } }
    }
});

describe("collectTeamIds", () => {
    it("lists the distinct team ids of the People steps in order", () => {
        const steps = [
            createReviewStep({
                id: "a",
                config: { teams: ["team-2", "team-1"], assignment: null }
            }),
            createReviewStep({ id: "b", config: { teams: ["team-1", "team-3"], assignment: null } })
        ];

        expect(collectTeamIds(steps, [])).toEqual(["team-2", "team-1", "team-3"]);
    });

    it("ignores AI steps and automation steps without a team setting", () => {
        expect(collectTeamIds([createAutomationStep(), createAiStep()], [])).toEqual([]);
    });

    it("adds the team id a ui team setting of an automation step holds (R284)", () => {
        const steps = [
            createReviewStep({ config: { teams: ["team-1"], assignment: null } }),
            createAutomationStep({
                config: {
                    automationId: "notify-team",
                    settings: { owner: "team-2", note: "team-9" }
                }
            })
        ];

        expect(collectTeamIds(steps, [NOTIFY_TEAM])).toEqual(["team-1", "team-2"]);
    });

    it("skips an empty team setting and an automation the list does not offer", () => {
        const steps = [
            createAutomationStep({
                config: { automationId: "notify-team", settings: { owner: "" } }
            }),
            createAutomationStep({
                config: { automationId: "gone", settings: { owner: "team-2" } }
            })
        ];

        expect(collectTeamIds(steps, [NOTIFY_TEAM])).toEqual([]);
    });

    it("is empty for no steps and for a step without teams", () => {
        expect(collectTeamIds([], [])).toEqual([]);
        expect(collectTeamIds([createReviewStep({ config: {} })], [])).toEqual([]);
    });
});
