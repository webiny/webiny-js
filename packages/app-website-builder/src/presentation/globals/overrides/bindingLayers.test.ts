import { describe, it, expect } from "vitest";
import { diffBindings, mergeBindings } from "./bindingLayers.js";

describe("binding layers", () => {
    it("merges binding layers per input, and diffs back to what an override must hold", () => {
        const base = {
            inputs: {
                title: { id: "t", type: "text", static: "Base" },
                tagline: { id: "g", type: "text", static: "Tagline" }
            },
            styles: { color: { static: "red" } }
        };
        const override = { inputs: { title: { id: "t", type: "text", static: "Override" } } };

        const merged = mergeBindings(base, override)!;
        expect(merged.inputs?.title.static).toBe("Override");
        expect(merged.inputs?.tagline.static).toBe("Tagline");
        expect(merged.styles).toEqual(base.styles);

        expect(diffBindings(merged, base)).toEqual(override);
        expect(diffBindings(base, base)).toBeUndefined();
        expect(mergeBindings(undefined, override)).toBe(override);
    });

    it("doesn't count an input as changed when only its id or type differ", () => {
        const inherited = { inputs: { title: { id: "a", type: "text", static: "Same" } } };
        const current = {
            inputs: { title: { id: "b", type: "text", static: "Same", translatable: true } }
        };

        expect(diffBindings(current, inherited)).toBeUndefined();
    });
});
