import { describe, expect, it } from "vitest";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";

const RAW = "Table workflows-secret is not reachable.";

describe("WorkflowPersistenceError", () => {
    it("sends a fixed message and keeps the storage error on the server", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });

        const error = new WorkflowPersistenceError(source);

        expect(error.code).toBe("Workflows/Workflow/Persistence");
        expect(error.message).toBe("The workflow could not be read or saved.");
        expect(error.data).toEqual({ cause: { code: "Storage/Failed" } });
        expect(JSON.stringify(error.data)).not.toContain(RAW);
        expect(JSON.stringify(error)).not.toContain(RAW);
        expect(error.source).toBe(source);
    });
});
