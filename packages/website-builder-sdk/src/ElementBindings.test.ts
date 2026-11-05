import { describe, it, expect } from "vitest";
import { ElementBindings } from "./ElementBindings.js";

describe("ElementBindings", () => {
    it("merges layers per input, and diffs back to what an override must hold", () => {
        const base = {
            inputs: {
                title: { id: "t", type: "text", static: "Base" },
                tagline: { id: "g", type: "text", static: "Tagline" }
            },
            styles: { color: { static: "red" } }
        };
        const override = { inputs: { title: { id: "t", type: "text", static: "Override" } } };

        const merged = ElementBindings.from(base).mergeWith(override).toJSON()!;
        expect(merged.inputs?.title.static).toBe("Override");
        expect(merged.inputs?.tagline.static).toBe("Tagline");
        expect(merged.styles).toEqual(base.styles);

        expect(ElementBindings.from(merged).diffFrom(base).toJSON()).toEqual(override);
        expect(ElementBindings.from(base).diffFrom(base).toJSON()).toBeUndefined();
    });

    it("keeps the other layer as it is when one is missing", () => {
        const layer = { inputs: { title: { id: "t", type: "text", static: "Only" } } };

        expect(ElementBindings.from(undefined).mergeWith(layer).toJSON()).toBe(layer);
        expect(ElementBindings.from(layer).mergeWith(null).toJSON()).toBe(layer);
        expect(ElementBindings.from(undefined).mergeWith(undefined).toJSON()).toBeUndefined();
    });

    it("merges breakpoint overrides per input and style, without adding empty maps", () => {
        const base = {
            inputs: { title: { id: "t", type: "text", static: "Base" } },
            overrides: {
                mobile: { styles: { color: { static: "red" }, margin: { static: "0" } } }
            }
        };
        const override = { overrides: { mobile: { styles: { color: { static: "blue" } } } } };

        expect(ElementBindings.from(base).mergeWith(override).toJSON()).toEqual({
            inputs: base.inputs,
            overrides: {
                mobile: { styles: { color: { static: "blue" }, margin: { static: "0" } } }
            }
        });
    });

    it("doesn't count an input as changed when only its id or type differ", () => {
        const inherited = { inputs: { title: { id: "a", type: "text", static: "Same" } } };
        const current = {
            inputs: { title: { id: "b", type: "text", static: "Same", translatable: true } }
        };

        expect(ElementBindings.from(current).diffFrom(inherited).toJSON()).toBeUndefined();
    });
});
