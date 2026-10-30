import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "./reviewFields.js";

describe("REVIEW_SYSTEM_WORKFLOW_SELECTION", () => {
    it("asks for the server's system.workflow review fields", () => {
        expect(REVIEW_SYSTEM_WORKFLOW_SELECTION).toBe(
            "workflowId reviewState stepId stepName stepState"
        );
    });
});
