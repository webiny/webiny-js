import { describe, expect, it } from "vitest";
import {
    AI_CAPABILITY_NOT_AVAILABLE_REASON,
    AI_REVIEW_FAILED_REASON,
    AI_REVIEW_NOT_STARTED_REASON,
    AI_STEP_INVALID_CONFIGURATION_REASON,
    aiModelNotAvailableReason,
    aiToolNotAvailableReason
} from "~/api/features/WorkflowReview/aiFailureReasons.js";

describe("aiFailureReasons (R170)", () => {
    it("pins the exact texts the step and the runner show", () => {
        expect(AI_STEP_INVALID_CONFIGURATION_REASON).toBe(
            "The AI step configuration is not valid."
        );
        expect(aiToolNotAvailableReason("readTarget")).toBe(
            'The AI tool "readTarget" is not available.'
        );
        expect(aiModelNotAvailableReason("anthropic/claude-a")).toBe(
            'The model "anthropic/claude-a" is not available.'
        );
        expect(AI_CAPABILITY_NOT_AVAILABLE_REASON).toBe(
            "The AI review capability is not available."
        );
        expect(AI_REVIEW_FAILED_REASON).toBe("The AI review failed.");
        expect(AI_REVIEW_NOT_STARTED_REASON).toBe("The AI review could not be started.");
    });
});
