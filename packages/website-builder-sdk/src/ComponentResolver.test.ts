import { describe, expect, it, vi, afterEach } from "vitest";
import { ComponentResolver } from "./ComponentResolver.js";
import { ComponentRegistry } from "./ComponentRegistry.js";
import { logger } from "./Logger.js";

const registryWith = (names: string[]) => {
    const registry = new ComponentRegistry();
    for (const name of names) {
        registry.register({
            component: (() => null) as never,
            manifest: { name, inputs: [] } as never
        });
    }
    return registry;
};

const element = (componentName: string) =>
    ({
        id: "el-1",
        type: "Webiny/Element",
        component: { name: componentName },
        parent: { id: "root", slot: "children" }
    }) as never;

const resolve = (registry: ComponentRegistry, wanted: string) =>
    new ComponentResolver(registry).resolve({
        element: element(wanted),
        elementBindings: { inputs: {} } as never,
        state: {} as never
    });

const captureWarnings = () => {
    const messages: string[] = [];
    vi.spyOn(logger, "warn").mockImplementation((message: unknown) => {
        messages.push(String(message));
    });
    return messages;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("ComponentResolver — what it says when a component is missing", () => {
    it("distinguishes an empty registry from a mismatch", () => {
        const messages = captureWarnings();

        expect(resolve(registryWith([]), "Site/FAQ Section")).toBeNull();
        expect(messages[0]).toContain("no components are registered at all");
    });

    it("offers the near miss, which is usually the whole diagnosis", () => {
        /*
         * The real case: pages referenced "2424Tulane/FAQ Section" and bundles registered
         * "Custom/FaqSection". 199 of 199 differed, every page rendered nothing, and the warning said
         * only "Unknown component".
         */
        const messages = captureWarnings();
        const registry = registryWith(["Custom/FaqSection", "Custom/HeroBanner"]);

        expect(resolve(registry, "2424Tulane/FAQ Section")).toBeNull();
        expect(messages[0]).toContain("2 registered");
        expect(messages[0]).toContain("Custom/FaqSection");
        expect(messages[0]).toContain("did you mean");
    });

    it("says what it has when nothing is close", () => {
        const messages = captureWarnings();
        const registry = registryWith(["Custom/Footer", "Custom/Header"]);

        expect(resolve(registry, "Site/Completely Different")).toBeNull();
        expect(messages[0]).toContain("none matching");
        expect(messages[0]).toContain("Custom/Footer");
    });

    it("says nothing when the component resolves", () => {
        const messages = captureWarnings();
        const registry = registryWith(["Custom/FaqSection"]);

        expect(resolve(registry, "Custom/FaqSection")).not.toBeNull();
        expect(messages).toEqual([]);
    });
});
