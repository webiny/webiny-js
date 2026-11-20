import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "./reviewFields.js";
import { WORKFLOW_FIELDS } from "./reviewFields.js";

describe("WORKFLOW_FIELDS", () => {
    it("selects the candidate teams of a step by id and name", () => {
        expect(WORKFLOW_FIELDS).toMatch(/candidateTeams\s*\{\s*id\s+name\s*\}/);
    });
});

describe("REVIEW_SYSTEM_WORKFLOW_SELECTION", () => {
    it("asks for the server's system.workflow review fields", () => {
        expect(REVIEW_SYSTEM_WORKFLOW_SELECTION).toBe(
            "workflowId reviewState stepId stepName stepState"
        );
    });
});
