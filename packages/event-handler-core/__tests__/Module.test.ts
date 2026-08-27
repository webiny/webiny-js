import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Module } from "~/features/events/Module.js";
import { runModules } from "~/features/events/runModules.js";

describe("Module (phased per-request lifecycle)", () => {
    it("runs every module's setup before any module's afterSetup", async () => {
        const order: string[] = [];
        const container = new Container();

        class ModuleA implements Module.Interface {
            async setup() {
                order.push("A.setup");
            }
            async afterSetup() {
                order.push("A.afterSetup");
            }
        }
        class ModuleB implements Module.Interface {
            async setup() {
                order.push("B.setup");
            }
            async afterSetup() {
                order.push("B.afterSetup");
            }
        }

        container.register(
            Module.createImplementation({ implementation: ModuleA, dependencies: [] })
        );
        container.register(
            Module.createImplementation({ implementation: ModuleB, dependencies: [] })
        );

        await runModules(container);

        // Phase barrier: BOTH setups run before EITHER afterSetup (not A.setup→A.afterSetup→B…).
        expect(order).toEqual(["A.setup", "B.setup", "A.afterSetup", "B.afterSetup"]);
    });

    it("afterSetup sees state produced by another module's setup (the bulk-actions case)", async () => {
        const container = new Container();

        // Producer registers a value during setup (phase 2). Modules read the shared ctx.container.
        const Value = "__moduleTestValue__";
        class ProducerModule implements Module.Interface {
            setup(ctx: Record<string, any>) {
                (ctx.container as any)[Value] = "ready";
            }
        }

        // Consumer reads it during afterSetup (phase 3) — would be undefined if it ran in setup.
        let observed: string | undefined;
        class ConsumerModule implements Module.Interface {
            afterSetup(ctx: Record<string, any>) {
                observed = (ctx.container as any)[Value];
            }
        }

        // Register consumer FIRST to prove ordering is by phase, not registration order.
        container.register(
            Module.createImplementation({ implementation: ConsumerModule, dependencies: [] })
        );
        container.register(
            Module.createImplementation({ implementation: ProducerModule, dependencies: [] })
        );

        await runModules(container);

        expect(observed).toBe("ready");
    });

    it("continueOnError logs and skips a failing phase callback", async () => {
        const container = new Container();
        const ran: string[] = [];

        class Boom implements Module.Interface {
            setup() {
                throw new Error("boom");
            }
        }
        class Ok implements Module.Interface {
            setup() {
                ran.push("ok");
            }
        }

        container.register(Module.createImplementation({ implementation: Boom, dependencies: [] }));
        container.register(Module.createImplementation({ implementation: Ok, dependencies: [] }));

        await expect(runModules(container, { continueOnError: true })).resolves.toBeUndefined();
        expect(ran).toEqual(["ok"]);

        // Without continueOnError it propagates.
        await expect(runModules(container)).rejects.toThrow("boom");
    });
});
