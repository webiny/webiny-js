import { describe, expect, it } from "vitest";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";

const RAW = "Table workflows-secret is not reachable.";

describe("WorkflowSettingsPersistenceError", () => {
    it("sends a fixed message and keeps the storage error on the server", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });

        const error = new WorkflowSettingsPersistenceError(source);

        expect(error.code).toBe("Workflows/Settings/Persistence");
        expect(error.message).toBe("The workflow settings could not be read or saved.");
        expect(error.data).toEqual({ cause: { code: "Storage/Failed" } });
        expect(JSON.stringify(error.data)).not.toContain(RAW);
        expect(JSON.stringify(error)).not.toContain(RAW);
        expect(error.source).toBe(source);
    });
});

describe("WorkflowSettingsPersistenceError wrapping a persistence error", () => {
    it("keeps the raw storage error as its source and the wrapped error's code", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });

        const error = new WorkflowSettingsPersistenceError(new WorkflowPersistenceError(source));

        expect(error.source).toBe(source);
        expect(error.data).toEqual({ cause: { code: "Workflows/Workflow/Persistence" } });
        expect(JSON.stringify(error)).not.toContain(RAW);
    });
});
