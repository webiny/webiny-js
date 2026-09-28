import { describe, expect, it } from "vitest";
import { ComponentsSdk } from "./ComponentsSdk.js";

/**
 * The bundle a real component produces, reduced to what hydration reads: a `createComponent` factory
 * returning a component and a manifest whose name is whatever the SOURCE declared. For a generated
 * component that is the model's invention (`Custom/FaqSection`), and it is never the name a page
 * references.
 */
const bundleDeclaring = (manifestName: string) => `
    __remoteComponent__ = {
        createComponent: function (runtime) {
            return {
                component: function () { return null; },
                manifest: { name: ${JSON.stringify(manifestName)}, label: "FAQ", inputs: [] }
            };
        }
    };
`;

const entry = (name: string, bundledJs: string) =>
    ({
        id: "component-id",
        name,
        label: name,
        bundledJs,
        bundledJsSha256: "",
        bundledCss: "",
        bundledCssSha256: "",
        sdkVersion: "1",
        status: "published"
    }) as never;

const sdk = () =>
    new ComponentsSdk({ apiUrl: "https://example.test/graphql", tenant: "root" } as never);

const dependencies = {
    sdk: {},
    React: { createElement: () => null, Fragment: null }
} as never;

describe("hydrateComponent — the name a component is registered under", () => {
    it("registers under the entry's name, not the name inside the bundle", () => {
        /*
         * This is the invariant that failed silently: the registry is keyed by manifest.name, a page
         * element records the promoted name, and while these disagreed every page rendered nothing —
         * 199 of 199 components unresolvable with every stage reporting success.
         */
        const hydrated = sdk().hydrateComponent(
            entry("2424Tulane/FAQ Section", bundleDeclaring("Custom/FaqSection")),
            dependencies
        );

        expect(hydrated?.manifest.name).toBe("2424Tulane/FAQ Section");
    });

    it("keeps a collision rename, which the bundle cannot know about", () => {
        // Promote renames on collision; the bundle was built before that and says the original name.
        const hydrated = sdk().hydrateComponent(
            entry("2424Tulane/Hero Banner (4)", bundleDeclaring("Custom/HeroBanner")),
            dependencies
        );

        expect(hydrated?.manifest.name).toBe("2424Tulane/Hero Banner (4)");
    });

    it("takes the rest of the manifest from the bundle", () => {
        // The bundle is the authority on inputs and defaults; only identity comes from the entry.
        const hydrated = sdk().hydrateComponent(
            entry("Site/Thing", bundleDeclaring("Custom/Thing")),
            dependencies
        );

        expect(hydrated?.manifest.label).toBe("FAQ");
        expect(hydrated?.manifest.inputs).toEqual([]);
    });

    it("scopes css by the same name it registers under", () => {
        // These two disagreeing is what the defect looked like from the outside: styles applied to a
        // component nothing could resolve.
        const hydrated = sdk().hydrateComponent(
            entry("2424Tulane/FAQ Section", bundleDeclaring("Custom/FaqSection")),
            dependencies
        );

        expect(hydrated?.scopeClassName).toBe("rc-2424tulane-faq-section");
    });
});

describe("hydrateComponent — saying why it failed", () => {
    /*
     * Each of these used to be the same silent `return null`. Callers drop a null, so a component
     * vanished leaving no error, no warning and no count — and the only symptom was an "Unknown
     * component" warning later, from a different package, naming a component nothing had said failed.
     */
    const failing = (bundle: string) => {
        const messages: string[] = [];
        const original = console.error;
        console.error = (...args: unknown[]) => messages.push(args.map(String).join(" "));
        try {
            const result = sdk().hydrateComponent(entry("Site/Thing", bundle), dependencies);
            return { result, messages };
        } finally {
            console.error = original;
        }
    };

    it("says so when the bundle defines no component", () => {
        const { result, messages } = failing("var x = 1;");

        expect(result).toBeNull();
        expect(messages.join(" ")).toContain("defined no __remoteComponent__");
        expect(messages.join(" ")).toContain("Site/Thing");
    });

    it("says so when the bundle exports no createComponent", () => {
        const { result, messages } = failing(`__remoteComponent__ = { somethingElse: 1 };`);

        expect(result).toBeNull();
        expect(messages.join(" ")).toContain("exports no createComponent");
        expect(messages.join(" ")).toContain("somethingElse");
    });

    it("says so when the factory builds nothing", () => {
        const { result, messages } = failing(
            `__remoteComponent__ = { createComponent: function () { return null; } };`
        );

        expect(result).toBeNull();
        expect(messages.join(" ")).toContain("builds nothing");
    });

    it("says so when the factory returns no component", () => {
        const { result, messages } = failing(
            `__remoteComponent__ = { createComponent: function () { return { manifest: { name: "x" } }; } };`
        );

        expect(result).toBeNull();
        expect(messages.join(" ")).toContain("returned no component");
        expect(messages.join(" ")).toContain("manifest");
    });
});
