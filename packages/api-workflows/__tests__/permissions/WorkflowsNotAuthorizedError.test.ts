import { describe, expect, it } from "vitest";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";

describe("WorkflowsNotAuthorizedError", () => {
    it("carries the refused action", () => {
        const error = new WorkflowsNotAuthorizedError({ action: "cancel" });

        expect(error.code).toBe("Workflows/NotAuthorized");
        expect(error.data).toEqual({ action: "cancel" });
        expect(error.message).toContain("cancel");
    });
});
