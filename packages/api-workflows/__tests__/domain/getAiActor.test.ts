import { describe, expect, it } from "vitest";
import { getAiActor } from "~/domain/ai/getAiActor.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import {
    AI_STEP_TYPE,
    AUTOMATION_STEP_TYPE,
    REVIEW_STEP_TYPE
} from "~/domain/workflow/stepTypes.js";
import { requester } from "~tests/__helpers/fixtures.js";

describe("AI_STEP_TYPE (R164)", () => {
    it("is the stored id of the AI step type, next to the built-in ones", () => {
        expect(AI_STEP_TYPE).toBe("ai");
        expect(REVIEW_STEP_TYPE).toBe("review");
        expect(AUTOMATION_STEP_TYPE).toBe("automation");
    });
});

describe("getAiActor (R141 mirror, R164)", () => {
    it("carries the requester's id and name with the ai type", () => {
        expect(getAiActor(requester)).toEqual({
            type: "ai",
            id: requester.id,
            displayName: requester.displayName
        });
    });

    it("omits the identity type, even when the requester has one", () => {
        expect(requester.identityType).toBe("admin");
        expect(getAiActor(requester)).not.toHaveProperty("identityType");
    });

    it("does not change the requester", () => {
        const copy = structuredClone(requester);

        getAiActor(requester);

        expect(requester).toEqual(copy);
    });

    it("differs from the automation actor only by its type", () => {
        expect({ ...getAiActor(requester), type: "automation" }).toEqual(
            getAutomationActor(requester)
        );
        expect(getAiActor(requester).type).not.toBe(getAutomationActor(requester).type);
    });
});
