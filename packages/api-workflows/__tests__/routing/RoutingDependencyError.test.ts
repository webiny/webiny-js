import { describe, expect, it } from "vitest";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";

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

describe("RoutingDependencyError", () => {
    it("sends a fixed message and keeps the storage error on the server", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });

        const error = new RoutingDependencyError(source);

        expect(error.code).toBe("Workflows/Routing/Dependency");
        expect(error.message).toBe("A lookup needed for routing failed.");
        expect(error.data).toEqual({ cause: { code: "Storage/Failed" } });
        expect(JSON.stringify(error.data)).not.toContain(RAW);
        expect(Object.getOwnPropertyDescriptor(error, "source")?.enumerable).toBe(false);
        expect(clientFields(error)).not.toContain(RAW);
        expect(error.source).toBe(source);
    });
});

describe("RoutingDependencyError wrapping another", () => {
    it("keeps the storage error and the fixed message, and adds what was decided", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });
        const decided = { candidateTeamIds: ["team-a"], ruleId: "rule-1", skips: [] };

        const error = new RoutingDependencyError(new RoutingDependencyError(source), decided);

        expect(error.message).toBe("A lookup needed for routing failed.");
        expect(error.data).toEqual({ cause: { code: "Storage/Failed" } });
        expect(Object.getOwnPropertyDescriptor(error, "source")?.enumerable).toBe(false);
        expect(clientFields(error)).not.toContain(RAW);
        expect(error.source).toBe(source);
        expect(error.decided).toEqual(decided);
    });
});

describe("RoutingDependencyError wrapping a persistence error", () => {
    it("keeps the raw storage error as its source and the wrapped error's code", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });

        const error = new RoutingDependencyError(new WorkflowSettingsPersistenceError(source));

        expect(error.source).toBe(source);
        expect(error.data).toEqual({ cause: { code: "Workflows/Settings/Persistence" } });
        expect(Object.getOwnPropertyDescriptor(error, "source")?.enumerable).toBe(false);
        expect(clientFields(error)).not.toContain(RAW);
    });
});

describe("RoutingDependencyError wrapping a routing error that wraps a persistence error", () => {
    it("keeps the cause the wrapped routing error reports", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });
        const decided = { candidateTeamIds: ["team-a"], ruleId: null, skips: [] };

        const error = new RoutingDependencyError(
            new RoutingDependencyError(new WorkflowSettingsPersistenceError(source)),
            decided
        );

        expect(error.source).toBe(source);
        expect(error.data).toEqual({ cause: { code: "Workflows/Settings/Persistence" } });
        expect(error.decided).toEqual(decided);
        expect(Object.getOwnPropertyDescriptor(error, "source")?.enumerable).toBe(false);
        expect(clientFields(error)).not.toContain(RAW);
    });
});
