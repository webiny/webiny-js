import { describe, expect, it } from "vitest";
import { RoutingDependencyError } from "~/domain/routing/errors.js";

const RAW = "Table workflows-secret is not reachable.";

describe("RoutingDependencyError", () => {
    it("sends a fixed message and keeps the storage error on the server", () => {
        const source = Object.assign(new Error(RAW), { code: "Storage/Failed" });

        const error = new RoutingDependencyError(source);

        expect(error.code).toBe("Workflows/Routing/Dependency");
        expect(error.message).toBe("A lookup needed for routing failed.");
        expect(error.data).toEqual({ cause: { code: "Storage/Failed" } });
        expect(JSON.stringify(error.data)).not.toContain(RAW);
        expect(JSON.stringify(error)).not.toContain(RAW);
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
        expect(JSON.stringify(error)).not.toContain(RAW);
        expect(error.source).toBe(source);
        expect(error.decided).toEqual(decided);
    });
});
