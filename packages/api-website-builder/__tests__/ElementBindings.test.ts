import { describe, expect, it } from "vitest";
import { ElementBindings } from "~/domain/shared/ElementBindings.js";

// The same cases as `ElementBindings.test.ts` in `@webiny/website-builder-sdk`: the editor and the delivery API
// must merge binding layers alike.
describe("ElementBindings.mergeWith", () => {
    it("merges layers per input: the later layer wins", () => {
        const base = {
            inputs: {
                title: { id: "t", type: "text", static: "Base" },
                tagline: { id: "g", type: "text", static: "Tagline" }
            },
            styles: { color: { static: "red" } }
        };
        const override = { inputs: { title: { id: "t", type: "text", static: "Override" } } };

        const merged = ElementBindings.from(base).mergeWith(override).toJSON()!;
        expect(merged.inputs.title.static).toBe("Override");
        expect(merged.inputs.tagline.static).toBe("Tagline");
        expect(merged.styles).toEqual(base.styles);
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
});
