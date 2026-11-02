import { describe, it, expect } from "vitest";
import {
    HandlerExecutionScope,
    StaleHandlerExecutionError
} from "~/features/events/HandlerExecutionScope.js";

describe("HandlerExecutionScope", () => {
    it("has no execution outside a scope", () => {
        expect(HandlerExecutionScope.getExecutionId()).toBeUndefined();
    });

    it("keeps the execution id across awaits", async () => {
        const id = await HandlerExecutionScope.run("execution-1", async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return HandlerExecutionScope.getExecutionId();
        });
        expect(id).toBe("execution-1");
    });

    it("keeps concurrent executions apart", async () => {
        const read = (executionId: string) => {
            return HandlerExecutionScope.run(executionId, async () => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return HandlerExecutionScope.getExecutionId();
            });
        };
        expect(await Promise.all([read("a"), read("b")])).toEqual(["a", "b"]);
    });

    it("allows use by the owning execution", () => {
        HandlerExecutionScope.run("execution-1", () => {
            expect(() => HandlerExecutionScope.assertOwner("Service", "execution-1")).not.toThrow();
        });
    });

    it("throws when another execution uses the service", () => {
        HandlerExecutionScope.run("execution-2", () => {
            expect(() => HandlerExecutionScope.assertOwner("Service", "execution-1")).toThrow(
                StaleHandlerExecutionError
            );
        });
    });

    it("does nothing outside a scope or for a service without an execution", () => {
        expect(() => HandlerExecutionScope.assertOwner("Service", "execution-1")).not.toThrow();
        HandlerExecutionScope.run("execution-2", () => {
            expect(() => HandlerExecutionScope.assertOwner("Service", undefined)).not.toThrow();
        });
    });
});
