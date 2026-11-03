import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { HandlerExecutionScope } from "~/features/events/HandlerExecutionScope.js";
import { StaleHandlerExecutionError } from "~/features/events/HandlerExecutionScope.js";

const owner = { executionId: "execution-1" };

describe("HandlerExecutionScope", () => {
    it("has no execution outside a scope", () => {
        expect(HandlerExecutionScope.getCurrent()).toBeUndefined();
    });

    it("keeps the execution across awaits", async () => {
        const frame = await HandlerExecutionScope.run("execution-1", async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return HandlerExecutionScope.getCurrent();
        });
        expect(frame?.executionId).toBe("execution-1");
    });

    it("keeps concurrent executions apart", async () => {
        const read = (executionId: string) => {
            return HandlerExecutionScope.run(executionId, async () => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return HandlerExecutionScope.getCurrent()?.executionId;
            });
        };
        const executionIds = await Promise.all([read("a"), read("b")]);
        expect(executionIds).toEqual(["a", "b"]);
    });

    it("allows use by the owning execution", () => {
        HandlerExecutionScope.run("execution-1", () => {
            const current = HandlerExecutionScope.getCurrent();
            expect(() => HandlerExecutionScope.assertOwner("Service", current)).not.toThrow();
        });
    });

    it("throws when another execution uses the service", () => {
        HandlerExecutionScope.run("execution-2", () => {
            expect(() => HandlerExecutionScope.assertOwner("Service", owner)).toThrow(
                StaleHandlerExecutionError
            );
        });
    });

    it("names both request ids in the error when they differ from the execution ids", () => {
        const ownerWithRequest = { executionId: "execution-1", requestId: "aws-1" };
        HandlerExecutionScope.run("execution-2", () => {
            HandlerExecutionScope.setRequestId("aws-2");
            expect(() => HandlerExecutionScope.assertOwner("Service", ownerWithRequest)).toThrow(
                /"execution-1" \(request "aws-1"\).*"execution-2" \(request "aws-2"\)/
            );
        });
    });

    it("does nothing outside a scope or for a service without an execution", () => {
        expect(() => HandlerExecutionScope.assertOwner("Service", owner)).not.toThrow();
        HandlerExecutionScope.run("execution-2", () => {
            expect(() => HandlerExecutionScope.assertOwner("Service", undefined)).not.toThrow();
        });
    });
});
