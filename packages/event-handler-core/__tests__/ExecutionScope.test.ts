import { describe, it, expect } from "vitest";
import { ExecutionScope, StaleExecutionScopeError } from "~/features/events/ExecutionScope.js";

describe("ExecutionScope", () => {
    it("has no execution outside a scope", () => {
        expect(ExecutionScope.getExecutionId()).toBeUndefined();
    });

    it("keeps the execution id across awaits", async () => {
        const id = await ExecutionScope.run("execution-1", async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return ExecutionScope.getExecutionId();
        });
        expect(id).toBe("execution-1");
    });

    it("keeps concurrent executions apart", async () => {
        const read = (executionId: string) => {
            return ExecutionScope.run(executionId, async () => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return ExecutionScope.getExecutionId();
            });
        };
        expect(await Promise.all([read("a"), read("b")])).toEqual(["a", "b"]);
    });

    it("allows use by the owning execution", () => {
        ExecutionScope.run("execution-1", () => {
            expect(() => ExecutionScope.assertOwner("Service", "execution-1")).not.toThrow();
        });
    });

    it("throws when another execution uses the service", () => {
        ExecutionScope.run("execution-2", () => {
            expect(() => ExecutionScope.assertOwner("Service", "execution-1")).toThrow(
                StaleExecutionScopeError
            );
        });
    });

    it("does nothing outside a scope or for a service without an execution", () => {
        expect(() => ExecutionScope.assertOwner("Service", "execution-1")).not.toThrow();
        ExecutionScope.run("execution-2", () => {
            expect(() => ExecutionScope.assertOwner("Service", undefined)).not.toThrow();
        });
    });
});
