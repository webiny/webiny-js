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

describe("KernelExecutionScope nested frames", () => {
    let scope: KernelExecutionScope.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(DefaultKernelExecutionScope).inSingletonScope();
        scope = container.resolve(KernelExecutionScope);
    });

    const nested = (
        execution: KernelExecutionScope.Frame,
        scopeId: string
    ): KernelExecutionScope.NestedFrame => {
        return { executionId: execution.executionId, scopeId, execution };
    };

    const tick = () => new Promise(resolve => setTimeout(resolve, 1));

    it("runs in the nested frame it is given, and keeps the execution frame as current", async () => {
        await scope.run("execution-1", async () => {
            const execution = scope.getCurrent()!;
            const frameA = nested(execution, "A");

            await scope.runNested(frameA, async () => {
                await tick();
                expect(scope.getCurrentNested()).toBe(frameA);
                expect(scope.getCurrent()).toBe(execution);
            });

            expect(scope.getCurrentNested()).toBeUndefined();
        });
    });

    it("keeps the same frame when the same scope is entered again", async () => {
        await scope.run("execution-1", async () => {
            const frameA = nested(scope.getCurrent()!, "A");
            const first = scope.runNested(frameA, () => scope.getCurrentNested());
            const second = await scope.runNested(frameA, async () => {
                await tick();
                return scope.getCurrentNested();
            });

            expect(first).toBe(frameA);
            expect(second).toBe(frameA);
            scope.runNested(frameA, () => {
                expect(() => scope.assertOwner(frameA, "Service")).not.toThrow();
            });
        });
    });

    it("lets a scope's service be used only inside that scope", async () => {
        await scope.run("execution-1", async () => {
            const execution = scope.getCurrent()!;
            const frameA = nested(execution, "A");
            const frameB = nested(execution, "B");

            scope.runNested(frameA, () => {
                expect(() => scope.assertOwner(frameA, "Service")).not.toThrow();
                expect(() => scope.assertOwner(frameB, "Service")).toThrow(
                    StaleKernelExecutionError
                );
            });
            scope.runNested(frameB, () => {
                expect(() => scope.assertOwner(frameA, "Service")).toThrow(
                    StaleKernelExecutionError
                );
            });
            // Outside any scope of the execution.
            expect(() => scope.assertOwner(frameA, "Service")).toThrow(StaleKernelExecutionError);
        });
    });

    it("lets a service of the execution's own container be used in every scope of it", async () => {
        await scope.run("execution-1", async () => {
            const execution = scope.getCurrent()!;
            const frameA = nested(execution, "A");
            const frameB = nested(execution, "B");

            expect(() => scope.assertOwner(execution, "Service")).not.toThrow();
            scope.runNested(frameA, () => {
                expect(() => scope.assertOwner(execution, "Service")).not.toThrow();
                // Entering scope B from inside scope A.
                scope.runNested(frameB, () => {
                    expect(() => scope.assertOwner(execution, "Service")).not.toThrow();
                    expect(() => scope.assertOwner(frameA, "Service")).toThrow(
                        StaleKernelExecutionError
                    );
                });
                // Back in scope A once scope B's callback returns.
                expect(scope.getCurrentNested()).toBe(frameA);
                expect(() => scope.assertOwner(frameA, "Service")).not.toThrow();
            });
        });
    });

    it("tells scopes apart even when they share a name", async () => {
        await scope.run("execution-1", async () => {
            const execution = scope.getCurrent()!;
            const first = nested(execution, "A");
            const second = nested(execution, "A");

            scope.runNested(second, () => {
                expect(() => scope.assertOwner(first, "Service")).toThrow(
                    /^Service belongs to scope "A" of kernel execution "execution-1" but was used inside another scope also named "A"\./
                );
            });
        });
    });

    it("keeps sibling async branches in their own scope", async () => {
        await scope.run("execution-1", async () => {
            const execution = scope.getCurrent()!;
            const frameA = nested(execution, "A");
            const frameB = nested(execution, "B");

            const read = (frame: KernelExecutionScope.NestedFrame) => {
                return scope.runNested(frame, async () => {
                    await tick();
                    scope.assertOwner(frame, "Service");
                    await tick();
                    return scope.getCurrentNested()?.scopeId;
                });
            };

            expect(await Promise.all([read(frameA), read(frameB)])).toEqual(["A", "B"]);
            expect(scope.getCurrentNested()).toBeUndefined();
        });
    });

    it("rejects a scope's service in a later execution", async () => {
        const frameA = scope.run("execution-1", () => nested(scope.getCurrent()!, "A"));

        scope.run("execution-2", () => {
            expect(() => scope.assertOwner(frameA, "Service")).toThrow(
                /^Service belongs to scope "A" of kernel execution "execution-1" but was used during kernel execution "execution-2"\./
            );
        });
    });

    it("refuses to enter a scope of another execution", async () => {
        const frameA = scope.run("execution-1", () => nested(scope.getCurrent()!, "A"));

        scope.run("execution-2", () => {
            expect(() => scope.runNested(frameA, () => "entered")).toThrow(
                /^Scope "A" belongs to kernel execution "execution-1" but was used during kernel execution "execution-2"\./
            );
        });
    });

    it("names both scopes in the error", async () => {
        await scope.run("execution-1", async () => {
            const execution = scope.getCurrent()!;
            const frameA = nested(execution, "tenant:A");
            const frameB = nested(execution, "tenant:B");

            scope.runNested(frameB, () => {
                expect(() => scope.assertOwner(frameA, "TenantContext")).toThrow(
                    /^TenantContext belongs to scope "tenant:A" of kernel execution "execution-1" but was used inside scope "tenant:B"\. /
                );
            });
            expect(() => scope.assertOwner(frameA)).toThrow(
                /^A service belongs to scope "tenant:A" of kernel execution "execution-1" but was used outside any scope\. /
            );
        });
    });
});
