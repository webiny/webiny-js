import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { createFeature } from "~/api/createFeature.js";
import { FeatureLifecycle } from "~/api/FeatureLifecycle.js";

describe("createFeature — per-request phases", () => {
    it("registers nothing extra for a feature without phases", () => {
        const container = new Container();

        const Plain = createFeature({
            name: "Plain",
            register() {
                // no phases declared
            }
        });

        Plain.register(container);

        expect(container.resolveAll(FeatureLifecycle)).toHaveLength(0);
    });

    it("stashes declared phases under the internal token", () => {
        const container = new Container();

        const WithPhases = createFeature({
            name: "WithPhases",
            register() {},
            setup() {},
            afterSetup() {}
        });

        WithPhases.register(container);

        const entries = container.resolveAll(FeatureLifecycle);
        expect(entries).toHaveLength(1);
        expect(entries[0].name).toBe("WithPhases");
        expect(typeof entries[0].setup).toBe("function");
        expect(typeof entries[0].afterSetup).toBe("function");
    });

    it("still runs the feature's own register()", () => {
        const container = new Container();
        let registered = false;

        const Feature = createFeature({
            name: "Feature",
            register() {
                registered = true;
            },
            setup() {}
        });

        Feature.register(container);

        expect(registered).toBe(true);
    });

    it("passes the register config through", () => {
        const container = new Container();
        let seen: string | undefined;

        const Configurable = createFeature<string>({
            name: "Configurable",
            register(_container, config) {
                seen = config;
            },
            setup() {}
        });

        Configurable.register(container, "hello");

        expect(seen).toBe("hello");
    });

    it("picks up a NESTED feature's phases — depth does not matter", () => {
        const container = new Container();

        // A sub-feature, registered from inside its parent's register() with the same container.
        const Child = createFeature({
            name: "Child",
            register() {},
            setup() {}
        });

        const Parent = createFeature({
            name: "Parent",
            register(c) {
                Child.register(c);
            }
        });

        Parent.register(container);

        expect(container.resolveAll(FeatureLifecycle).map(e => e.name)).toEqual(["Child"]);
    });

    it("a gated feature that never registers contributes no phases", () => {
        const container = new Container();
        let enabled = false;

        const Inner = createFeature({
            name: "Inner",
            register() {},
            setup() {}
        });

        // Mirrors today's license gating: the parent early-returns, so the child that owns the
        // phases is never registered — and therefore never runs them.
        const Gated = createFeature({
            name: "Gated",
            register(c) {
                if (!enabled) {
                    return;
                }
                Inner.register(c);
            }
        });

        Gated.register(container);
        expect(container.resolveAll(FeatureLifecycle)).toHaveLength(0);

        enabled = true;
        Gated.register(container);
        expect(container.resolveAll(FeatureLifecycle).map(e => e.name)).toEqual(["Inner"]);
    });

    it("keeps registration order — the order register() was called", () => {
        const container = new Container();

        const make = (name: string) => createFeature({ name, register() {}, setup() {} });

        make("First").register(container);
        make("Second").register(container);
        make("Third").register(container);

        expect(container.resolveAll(FeatureLifecycle).map(e => e.name)).toEqual([
            "First",
            "Second",
            "Third"
        ]);
    });
});
