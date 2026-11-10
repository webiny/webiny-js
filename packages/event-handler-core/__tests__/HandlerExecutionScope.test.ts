import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { HandlerExecutionScope } from "~/features/events/HandlerExecutionScope.js";
import { DefaultHandlerExecutionScope } from "~/features/events/DefaultHandlerExecutionScope.js";
import { StaleHandlerExecutionError } from "~/features/events/StaleHandlerExecutionError.js";

const owner = { executionId: "execution-1" };

describe("HandlerExecutionScope", () => {
    let scope: HandlerExecutionScope.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(DefaultHandlerExecutionScope).inSingletonScope();
        scope = container.resolve(HandlerExecutionScope);
    });

    it("has no execution outside a scope", () => {
        expect(scope.getCurrent()).toBeUndefined();
    });

    it("keeps the execution across awaits", async () => {
        const frame = await scope.run("execution-1", async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return scope.getCurrent();
        });
        expect(frame?.executionId).toBe("execution-1");
    });

    it("keeps concurrent executions apart", async () => {
        const read = (executionId: string) => {
            return scope.run(executionId, async () => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return scope.getCurrent()?.executionId;
            });
        };
        const executionIds = await Promise.all([read("a"), read("b")]);
        expect(executionIds).toEqual(["a", "b"]);
    });

    it("allows use by the owning execution", () => {
        scope.run("execution-1", () => {
            const current = scope.getCurrent();
            expect(() => scope.assertOwner(current, "Service")).not.toThrow();
        });
    });

    it("throws when another execution uses the service", () => {
        scope.run("execution-2", () => {
            expect(() => scope.assertOwner(owner, "Service")).toThrow(StaleHandlerExecutionError);
        });
    });

    it("names both executions in the error", () => {
        scope.run("execution-2", () => {
            expect(() => scope.assertOwner(owner, "Service")).toThrow(
                /handler execution "execution-1" but was used during handler execution "execution-2"/
            );
        });
    });

    it("names the caller only when it is given", () => {
        scope.run("execution-2", () => {
            expect(() => scope.assertOwner(owner)).toThrow(
                /^A service belongs to handler execution/
            );
            expect(() => scope.assertOwner(owner, "TenantContext")).toThrow(
                /^TenantContext belongs to handler execution/
            );
        });
    });

    it("does not see executions opened on another scope instance", () => {
        const other = new Container();
        other.register(DefaultHandlerExecutionScope).inSingletonScope();
        const otherScope = other.resolve(HandlerExecutionScope);

        otherScope.run("execution-2", () => {
            expect(scope.getCurrent()).toBeUndefined();
        });
    });

    it("does nothing outside a scope or for a service without an execution", () => {
        expect(() => scope.assertOwner(owner, "Service")).not.toThrow();
        scope.run("execution-2", () => {
            expect(() => scope.assertOwner(undefined, "Service")).not.toThrow();
        });
    });
});
