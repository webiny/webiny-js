import { describe, expect, it } from "vitest";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";

describe("WorkflowPersistenceError", () => {
    it("keeps the cause code and message", () => {
        const cause = Object.assign(new Error("Boom"), { code: "Cms/Entry/Failed" });

        const error = new WorkflowPersistenceError(cause);

        expect(error.message).toBe("Boom");
        expect(error.data).toEqual({ cause: { code: "Cms/Entry/Failed", message: "Boom" } });
    });
});
