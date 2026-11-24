import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { KernelExecutionScope } from "~/features/kernel/KernelExecutionScope.js";
import { DefaultKernelExecutionScope } from "~/features/kernel/DefaultKernelExecutionScope.js";
import { StaleKernelExecutionError } from "~/features/kernel/StaleKernelExecutionError.js";

const owner = { executionId: "execution-1" };

describe("KernelExecutionScope", () => {
    let scope: KernelExecutionScope.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(DefaultKernelExecutionScope).inSingletonScope();
        scope = container.resolve(KernelExecutionScope);
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
            expect(() => scope.assertOwner(owner, "Service")).toThrow(StaleKernelExecutionError);
        });
    });

    it("names both executions in the error", () => {
        scope.run("execution-2", () => {
            expect(() => scope.assertOwner(owner, "Service")).toThrow(
                /kernel execution "execution-1" but was used during kernel execution "execution-2"/
            );
        });
    });

    it("names the caller only when it is given", () => {
        scope.run("execution-2", () => {
            expect(() => scope.assertOwner(owner)).toThrow(
                /^A service belongs to kernel execution/
            );
            expect(() => scope.assertOwner(owner, "TenantContext")).toThrow(
                /^TenantContext belongs to kernel execution/
            );
        });
    });

    it("does not see executions opened on another scope instance", () => {
        const other = new Container();
        other.register(DefaultKernelExecutionScope).inSingletonScope();
        const otherScope = other.resolve(KernelExecutionScope);

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
