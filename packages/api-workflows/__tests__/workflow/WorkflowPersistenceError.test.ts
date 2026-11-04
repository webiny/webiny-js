import { describe, expect, it } from "vitest";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";

const RAW = "Table workflows-secret is not reachable.";

/**
 * Every own field of the error, enumerable or not, except its server-only `source` and `stack`:
 * what a client could get. `JSON.stringify(error)` alone skips the non-enumerable `message`.
 */
const clientFields = (error: Error): string => {
    const fields: Record<string, unknown> = {};
    for (const key of Object.getOwnPropertyNames(error)) {
        if (key !== "source" && key !== "stack") {
            fields[key] = (error as unknown as Record<string, unknown>)[key];
        }
    }
    return JSON.stringify(fields);
};

describe("WorkflowPersistenceError", () => {
    it("sends a fixed message and keeps the storage error on the server", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });

        const error = new WorkflowPersistenceError(source);

        expect(error.code).toBe("Workflows/Workflow/Persistence");
        expect(error.message).toBe("The workflow could not be read or saved.");
        expect(error.data).toEqual({ cause: { code: "Storage/Failed" } });
        expect(JSON.stringify(error.data)).not.toContain(RAW);
        expect(Object.getOwnPropertyDescriptor(error, "source")?.enumerable).toBe(false);
        expect(clientFields(error)).not.toContain(RAW);
        expect(error.source).toBe(source);
    });
});

describe("WorkflowPersistenceError wrapping a persistence error", () => {
    it("keeps the raw storage error as its source and the wrapped error's code", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });

        const error = new WorkflowPersistenceError(new ReviewPersistenceError(source));

        expect(error.source).toBe(source);
        expect(error.data).toEqual({ cause: { code: "Workflows/Review/Persistence" } });
        expect(Object.getOwnPropertyDescriptor(error, "source")?.enumerable).toBe(false);
        expect(clientFields(error)).not.toContain(RAW);
    });
});
