import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { createFeature } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { runFeaturePhases } from "~/runFeaturePhases.js";

const registerNullLogger = (container: Container) => {
    const warn = vi.fn();
    container.registerInstance(Logger, {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn,
        error: vi.fn(),
        fatal: vi.fn(),
        log: vi.fn()
    });
    return warn;
};

describe("runFeaturePhases", () => {
    it("runs every feature's setup before any feature's afterSetup", async () => {
        const container = new Container();
        const order: string[] = [];

        createFeature({
            name: "A",
            register() {},
            setup() {
                order.push("A.setup");
            },
            afterSetup() {
                order.push("A.afterSetup");
            }
        }).register(container);

        createFeature({
            name: "B",
            register() {},
            setup() {
                order.push("B.setup");
            },
            afterSetup() {
                order.push("B.afterSetup");
            }
        }).register(container);

        await runFeaturePhases(container);

        // Phase barrier: BOTH setups run before EITHER afterSetup.
        expect(order).toEqual(["A.setup", "B.setup", "A.afterSetup", "B.afterSetup"]);
    });

    it("afterSetup sees what another feature's setup produced (the cross-feature case)", async () => {
        const container = new Container();
        const models: string[] = [];
        let observed: string[] = [];

        // Registered SECOND, but its afterSetup still sees the producer's models — ordering is by
        // phase, not by registration order.
        createFeature({
            name: "Consumer",
            register() {},
            afterSetup() {
                observed = [...models];
            }
        }).register(container);

        createFeature({
            name: "Producer",
            register() {},
            setup() {
                models.push("Folder");
            }
        }).register(container);

        await runFeaturePhases(container);

        expect(observed).toEqual(["Folder"]);
    });

    it("awaits async phases", async () => {
        const container = new Container();
        const order: string[] = [];

        createFeature({
            name: "Slow",
            register() {},
            async setup() {
                await new Promise(resolve => setTimeout(resolve, 5));
                order.push("slow.setup");
            }
        }).register(container);

        createFeature({
            name: "Fast",
            register() {},
            setup() {
                order.push("fast.setup");
            }
        }).register(container);

        await runFeaturePhases(container);

        expect(order).toEqual(["slow.setup", "fast.setup"]);
    });

    it("merges options.context into the ctx handed to each phase", async () => {
        const container = new Container();
        const seen: Record<string, unknown> = {};

        createFeature({
            name: "Reader",
            register() {},
            setup(ctx) {
                seen.tenant = ctx.tenant;
                seen.hasContainer = ctx.container === container;
            },
            afterSetup(ctx) {
                seen.afterTenant = ctx.tenant;
            }
        }).register(container);

        await runFeaturePhases(container, { context: { tenant: "acme" } });

        expect(seen).toEqual({ tenant: "acme", hasContainer: true, afterTenant: "acme" });
    });

    it("propagates a failing phase by default (HTTP fail-fast)", async () => {
        const container = new Container();

        createFeature({
            name: "Boom",
            register() {},
            setup() {
                throw new Error("boom");
            }
        }).register(container);

        await expect(runFeaturePhases(container)).rejects.toThrow("boom");
    });

    it("continueOnError logs and skips the failing phase (background-task behaviour)", async () => {
        const container = new Container();
        const warn = registerNullLogger(container);
        const ran: string[] = [];

        createFeature({
            name: "Boom",
            register() {},
            setup() {
                throw new Error("boom");
            }
        }).register(container);

        createFeature({
            name: "Ok",
            register() {},
            setup() {
                ran.push("ok");
            }
        }).register(container);

        await expect(
            runFeaturePhases(container, { continueOnError: true })
        ).resolves.toBeUndefined();
        expect(ran).toEqual(["ok"]);
        expect(warn).toHaveBeenCalledOnce();
    });

    it("is a no-op when no feature declares phases", async () => {
        const container = new Container();

        createFeature({ name: "Plain", register() {} }).register(container);

        await expect(runFeaturePhases(container)).resolves.toBeUndefined();
    });
});
