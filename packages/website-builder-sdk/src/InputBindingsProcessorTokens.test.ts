import { describe, expect, it } from "vitest";
import { InputsBindingsProcessor } from "./InputBindingsProcessor.js";
import type { InputAstNode } from "~/ComponentManifestToAstConverter.js";
import type { DocumentElementBindings, TokenReference } from "~/types.js";
import { ElementFactory } from "~/ElementFactory.js";
import type { InputsUpdater } from "~/InputsUpdater.js";

/**
 * Token references on element *inputs* — the counterpart to the same support on styles.
 *
 * Inputs were the harder half: the styles processor works over a flat map of CSS properties, whereas this
 * one reconstructs nested and list bindings from `/`-delimited paths, and each binding carries `type`,
 * `list` and `id` alongside its value.
 */

const ELEMENT_ID = "el-1";

const BRAND: TokenReference = { path: "color.action.primary.background", fallback: "#1f6feb" };
const SURFACE: TokenReference = { path: "color.surface.page", fallback: "#ffffff" };

const ast: InputAstNode[] = [
    {
        name: "background",
        type: "color",
        list: false,
        path: "background",
        children: [],
        input: { type: "color", name: "background", label: "Background" }
    },
    {
        name: "border",
        type: "color",
        list: false,
        path: "border",
        children: [],
        input: { type: "color", name: "border", label: "Border", responsive: true }
    },
    {
        name: "items",
        type: "object",
        list: true,
        path: "items",
        children: [
            {
                name: "color",
                type: "color",
                list: false,
                path: "items.color",
                children: [],
                input: { type: "color", name: "color", label: "Colour" }
            }
        ],
        input: {
            type: "object",
            name: "items",
            list: true,
            fields: [{ type: "color", name: "color", label: "Colour" }]
        }
    }
];

const BREAKPOINTS = ["desktop", "tablet", "mobile"];

const makeProcessor = (bindings: DocumentElementBindings) =>
    new InputsBindingsProcessor(ELEMENT_ID, ast, BREAKPOINTS, bindings, new ElementFactory({}));

const emptyBindings = (): DocumentElementBindings => ({ inputs: {}, styles: {} });

/** Applies the update to a stand-in document and returns the element's bindings, as the editor sees them. */
const apply = (updater: InputsUpdater) => {
    const document: any = { bindings: { [ELEMENT_ID]: { inputs: {}, styles: {} } } };
    updater.applyToDocument(document);
    return document.bindings[ELEMENT_ID];
};

describe("toTokenMap", () => {
    it("reports token bindings by their flat path", () => {
        const map = makeProcessor(emptyBindings()).toTokenMap({
            background: { token: BRAND, id: "a", type: "color" },
            border: { static: "#cccccc", id: "b", type: "color" }
        });

        expect(map).toEqual({ background: BRAND });
    });

    it("finds tokens inside list items", () => {
        const map = makeProcessor(emptyBindings()).toTokenMap({
            "items/0/color": { token: BRAND, id: "a", type: "color" },
            "items/1/color": { static: "#000000", id: "b", type: "color" }
        });

        expect(map).toEqual({ "items/0/color": BRAND });
    });

    it("is empty for an element with no bindings", () => {
        expect(makeProcessor(emptyBindings()).toTokenMap()).toEqual({});
    });
});

describe("toDeepInputs with tokens", () => {
    it("resolves a token to its CSS variable so the preview renders the themed value", () => {
        const deep = makeProcessor(emptyBindings()).toDeepInputs({
            background: { token: BRAND, id: "a", type: "color" }
        });

        expect(deep.background).toBe("var(--wby-color-action-primary-background, #1f6feb)");
    });

    it("emits the variable without a fallback when none was captured", () => {
        const deep = makeProcessor(emptyBindings()).toDeepInputs({
            background: { token: { path: "color.surface.page" }, id: "a", type: "color" }
        });

        expect(deep.background).toBe("var(--wby-color-surface-page)");
    });

    it("still reads literals unchanged", () => {
        const deep = makeProcessor(emptyBindings()).toDeepInputs({
            background: { static: "#abcdef", id: "a", type: "color" }
        });

        expect(deep.background).toBe("#abcdef");
    });

    it("resolves tokens inside list items", () => {
        const deep = makeProcessor(emptyBindings()).toDeepInputs({
            "items/0/color": { token: BRAND, id: "a", type: "color" }
        });

        expect(deep.items[0].color).toBe("var(--wby-color-action-primary-background, #1f6feb)");
    });
});

describe("createUpdate with tokens", () => {
    it("stores a reference instead of a literal", () => {
        const updater = makeProcessor(emptyBindings()).createUpdate(
            { background: "#1f6feb" },
            "desktop",
            { background: BRAND }
        );

        const binding = apply(updater).inputs.background;

        expect(binding.token).toEqual(BRAND);
        expect(binding).not.toHaveProperty("static");
    });

    it("keeps the type, list flag and id alongside the reference", () => {
        // These travel with an input binding and are not optional — a token binding that dropped them
        // would break every reader that switches on `type`.
        const updater = makeProcessor(emptyBindings()).createUpdate(
            { background: "#1f6feb" },
            "desktop",
            { background: BRAND }
        );

        const binding = apply(updater).inputs.background;

        expect(binding.type).toBe("color");
        expect(binding.list).toBe(false);
        expect(binding.id).toBeTruthy();
    });

    it("clears a reference when a free value is picked instead", () => {
        // The absence of a path from the token map is the signal, which is why callers must seed the map
        // from `toTokenMap` rather than passing only what they changed.
        const updater = makeProcessor({
            inputs: { background: { token: BRAND, id: "a", type: "color" } },
            styles: {}
        }).createUpdate({ background: "#ff0000" }, "desktop", {});

        const binding = apply(updater).inputs.background;

        expect(binding.static).toBe("#ff0000");
        expect(binding).not.toHaveProperty("token");
    });

    it("replaces one token with another without leaving the first behind", () => {
        const updater = makeProcessor({
            inputs: { background: { token: BRAND, id: "a", type: "color" } },
            styles: {}
        }).createUpdate({ background: "#ffffff" }, "desktop", { background: SURFACE });

        expect(apply(updater).inputs.background.token).toEqual(SURFACE);
    });

    it("never stores a literal and a reference together", () => {
        // Which one wins would otherwise depend on the reader.
        const updater = makeProcessor({
            inputs: { background: { static: "#abcdef", id: "a", type: "color" } },
            styles: {}
        }).createUpdate({ background: "#1f6feb" }, "desktop", { background: BRAND });

        const binding = apply(updater).inputs.background;

        expect(Object.keys(binding)).not.toContain("static");
        expect(binding.token).toEqual(BRAND);
    });

    it("preserves the existing binding id when replacing a literal with a token", () => {
        const updater = makeProcessor({
            inputs: { background: { static: "#abcdef", id: "keep-me", type: "color" } },
            styles: {}
        }).createUpdate({ background: "#1f6feb" }, "desktop", { background: BRAND });

        expect(apply(updater).inputs.background.id).toBe("keep-me");
    });

    it("stores a reference on a list item", () => {
        const updater = makeProcessor(emptyBindings()).createUpdate(
            { items: [{ color: "#1f6feb" }, { color: "#000000" }] },
            "desktop",
            { "items/0/color": BRAND }
        );

        const inputs = apply(updater).inputs;

        expect(inputs["items/0/color"].token).toEqual(BRAND);
        expect(inputs["items/1/color"].static).toBe("#000000");
    });

    it("leaves literal bindings alone when an unrelated token is set", () => {
        const updater = makeProcessor(emptyBindings()).createUpdate(
            { background: "#1f6feb", border: "#cccccc" },
            "desktop",
            { background: BRAND }
        );

        const inputs = apply(updater).inputs;

        expect(inputs.background.token).toEqual(BRAND);
        expect(inputs.border.static).toBe("#cccccc");
    });
});

describe("createUpdate token inheritance across breakpoints", () => {
    const withDesktopToken = (): DocumentElementBindings => ({
        inputs: { border: { token: BRAND, id: "a", type: "color" } },
        styles: {}
    });

    it("does not write an override that repeats the inherited token", () => {
        // The bug this guards: `getInheritedValue` only ever read `.static`, so a token inherited from a
        // parent breakpoint looked unset and an override was written every time — which would then stop
        // following the theme at that breakpoint.
        const updater = makeProcessor(withDesktopToken()).createUpdate(
            { border: "var(--wby-color-action-primary-background, #1f6feb)" },
            "mobile",
            { border: BRAND }
        );

        expect(apply(updater).overrides?.mobile?.inputs?.border).toBeUndefined();
    });

    it("writes an override for a different token", () => {
        const updater = makeProcessor(withDesktopToken()).createUpdate(
            { border: "#ffffff" },
            "mobile",
            { border: SURFACE }
        );

        expect(apply(updater).overrides.mobile.inputs.border.token).toEqual(SURFACE);
    });

    it("writes an override when a literal replaces an inherited token", () => {
        // A token and a literal are genuinely different bindings, so this is never redundant.
        const updater = makeProcessor(withDesktopToken()).createUpdate(
            { border: "#ff0000" },
            "mobile",
            {}
        );

        expect(apply(updater).overrides.mobile.inputs.border.static).toBe("#ff0000");
    });

    it("writes an override when a token replaces an inherited literal", () => {
        const updater = makeProcessor({
            inputs: { border: { static: "#cccccc", id: "a", type: "color" } },
            styles: {}
        }).createUpdate({ border: "#1f6feb" }, "mobile", { border: BRAND });

        expect(apply(updater).overrides.mobile.inputs.border.token).toEqual(BRAND);
    });

    it("still skips an override that repeats an inherited literal", () => {
        // The pre-existing behaviour, retained.
        const updater = makeProcessor({
            inputs: { border: { static: "#cccccc", id: "a", type: "color" } },
            styles: {}
        }).createUpdate({ border: "#cccccc" }, "mobile", {});

        expect(apply(updater).overrides?.mobile?.inputs?.border).toBeUndefined();
    });

    it("removes an existing override when the value is unset entirely", () => {
        // Neither a literal nor a token: the override goes away and the breakpoint inherits again.
        const bindings: DocumentElementBindings = {
            inputs: { border: { static: "#cccccc", id: "a", type: "color" } },
            overrides: {
                mobile: { inputs: { border: { static: "#ff0000", id: "a", type: "color" } } }
            },
            styles: {}
        };

        const updater = makeProcessor(bindings).createUpdate({ border: undefined }, "mobile", {});

        expect(apply(updater).overrides?.mobile?.inputs?.border).toBeUndefined();
    });

    it("keeps the base binding untouched while writing a breakpoint override", () => {
        const updater = makeProcessor(withDesktopToken()).createUpdate(
            { border: "#ffffff" },
            "mobile",
            { border: SURFACE }
        );

        expect(apply(updater).inputs.border.token).toEqual(BRAND);
    });
});
