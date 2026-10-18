import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { WorkflowErrorCode } from "./WorkflowErrorCode.js";

describe("WorkflowErrorCode", () => {
    it("pins every code to the server's string", () => {
        expect(WorkflowErrorCode).toEqual({
            NotFound: "Workflows/Workflow/NotFound",
            Conflict: "Workflows/Workflow/Conflict",
            Validation: "Workflows/Workflow/Validation",
            Persistence: "Workflows/Workflow/Persistence",
            HasActiveReviews: "Workflows/Workflow/HasActiveReviews",
            NotAuthorized: "Workflows/NotAuthorized"
        });
    });
});
