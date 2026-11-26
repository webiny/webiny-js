import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Abstraction } from "@webiny/di";
import type { Container } from "@webiny/di";
import { InputHandler } from "~/features/kernel/InputHandler.js";
import type { InputContext } from "~/features/kernel/InputHandler.js";
import { InputType } from "~/features/kernel/InputType.js";
import { Kernel } from "~/features/kernel/Kernel.js";
import { KernelExecution } from "~/features/kernel/KernelExecution.js";
import { RequestContainer } from "~/features/kernel/RequestContainer.js";
import { StaleKernelExecutionError } from "~/features/kernel/StaleKernelExecutionError.js";

class AnyInputType implements InputType.Interface {
    matches(_event: any): _event is any {
        return true;
    }
    getHandlerAbstraction() {
        return InputHandler;
    }
}

const anyInputType = InputType.createImplementation({
    implementation: AnyInputType,
    dependencies: []
});

/** A service with per-container state, which checks it is used where it was built. */
interface IGuardedService {
    read(): string;
}

const GuardedService = new Abstraction<IGuardedService>("GuardedService");

class GuardedServiceImpl implements IGuardedService {
    constructor(private readonly kernelExecution: KernelExecution.Interface) {}

    read(): string {
        this.kernelExecution.assertCurrent("GuardedService");
        return this.kernelExecution.getScopeId() ?? "request";
    }
}

const guardedService = GuardedService.createImplementation({
    implementation: GuardedServiceImpl,
    dependencies: [KernelExecution]
});

/** A nested container, built the way a tenant's scope will be: a child with its own nested execution. */
interface ITestScope {
    container: Container;
    execution: KernelExecution.Nested;
    run<T>(cb: (container: Container) => T): T;
}

function createScope(request: Container, scopeId: string): ITestScope {
    const container = request.createChildContainer();
    const execution = request.resolve(KernelExecution).createNested(scopeId);
    container.registerInstance(KernelExecution, execution);
    container.register(guardedService).inSingletonScope();
    return {
        container,
        execution,
        run: cb => execution.run(() => cb(container))
    };
}

type TestFn = (request: Container) => Promise<unknown>;

/** An app whose handler runs the event's `test` with that execution's request container. */
function createApp() {
    class TestHandler implements InputHandler.Interface<{ test: TestFn }> {
        constructor(private readonly request: Container) {}

        execute(ctx: InputContext<{ test: TestFn }>) {
            return ctx.input.test(this.request);
        }
    }

    return Kernel.init({
        root: container => {
            container.register(anyInputType);
            container.register(
                InputHandler.createImplementation({
                    implementation: TestHandler,
                    dependencies: [RequestContainer]
                })
            );
        },
        child: container => {
            container.register(guardedService).inSingletonScope();
        }
    });
}

/** Runs `test` as the handler of one execution of a new app. */
function handleWith(test: TestFn) {
    return createApp().handle({ test });
}

const tick = () => new Promise(resolve => setTimeout(resolve, 1));

describe("Nested kernel executions", () => {
    it("throws when a service from scope A is used inside scope B", async () => {
        await handleWith(async request => {
            const scopeA = createScope(request, "tenant:A");
            const scopeB = createScope(request, "tenant:B");

            const serviceA = scopeA.run(container => container.resolve(GuardedService));
            expect(scopeA.run(() => serviceA.read())).toBe("tenant:A");

            await scopeB.run(async () => {
                await tick();
                expect(() => serviceA.read()).toThrow(StaleKernelExecutionError);
                expect(() => serviceA.read()).toThrow(
                    /^GuardedService belongs to scope "tenant:A" of kernel execution "[0-9a-f-]{36}" but was used inside scope "tenant:B"\./
                );
            });

            // Outside any scope, in the request itself.
            expect(() => serviceA.read()).toThrow(/but was used outside any scope\./);
        });
    });

    it("lets a request-level service be used in every scope of its execution", async () => {
        await handleWith(async request => {
            const requestService = request.resolve(GuardedService);
            const scopeA = createScope(request, "tenant:A");
            const scopeB = createScope(request, "tenant:B");

            expect(requestService.read()).toBe("request");
            await scopeA.run(async () => {
                await tick();
                expect(requestService.read()).toBe("request");
                await scopeB.run(async () => {
                    await tick();
                    expect(requestService.read()).toBe("request");
                });
            });
        });
    });

    it("keeps the same frame when a scope is entered again", async () => {
        await handleWith(async request => {
            const scopeA = createScope(request, "tenant:A");
            const service = scopeA.run(container => container.resolve(GuardedService));

            const reads = await Promise.all([
                scopeA.run(async () => {
                    await tick();
                    return service.read();
                }),
                scopeA.run(async () => {
                    await tick();
                    return service.read();
                })
            ]);
            expect(reads).toEqual(["tenant:A", "tenant:A"]);
        });
    });

    it("keeps sibling async branches in their own scope", async () => {
        await handleWith(async request => {
            const scopes = [createScope(request, "tenant:A"), createScope(request, "tenant:B")];

            const reads = await Promise.all(
                scopes.map(scope => {
                    return scope.run(async container => {
                        const service = container.resolve(GuardedService);
                        await tick();
                        const before = service.read();
                        await tick();
                        return [before, service.read()];
                    });
                })
            );

            expect(reads).toEqual([
                ["tenant:A", "tenant:A"],
                ["tenant:B", "tenant:B"]
            ]);
        });
    });

    it("gives a nested execution its execution's id, and a sibling when nested again", async () => {
        await handleWith(async request => {
            const requestExecution = request.resolve(KernelExecution);
            const scopeA = createScope(request, "tenant:A");
            const sibling = scopeA.execution.createNested("tenant:B");

            expect(scopeA.execution.getId()).toBe(requestExecution.getId());
            expect(sibling.getId()).toBe(requestExecution.getId());
            expect(sibling.getScopeId()).toBe("tenant:B");

            // The sibling is not inside scope A: scope A's services throw in it.
            const serviceA = scopeA.run(container => container.resolve(GuardedService));
            sibling.run(() => {
                expect(() => serviceA.read()).toThrow(/but was used inside scope "tenant:B"\./);
            });
        });
    });

    it("rejects a scope kept from an earlier execution", async () => {
        let kept: ITestScope | undefined;
        let keptService: IGuardedService | undefined;

        // Both executions run on one app, so they share its kernel execution scope.
        const app = createApp();
        await app.handle({
            test: async (request: Container) => {
                kept = createScope(request, "tenant:A");
                keptService = kept.run(container => container.resolve(GuardedService));
            }
        });

        await app.handle({
            test: async () => {
                expect(() => kept!.run(() => "entered")).toThrow(
                    /^Scope "tenant:A" belongs to kernel execution "[0-9a-f-]{36}" but was used during kernel execution "[0-9a-f-]{36}"\./
                );
                expect(() => keptService!.read()).toThrow(
                    /^GuardedService belongs to scope "tenant:A" of kernel execution/
                );
            }
        });
    });
});
