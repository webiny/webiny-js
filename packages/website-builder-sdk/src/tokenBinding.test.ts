import { describe, expect, it } from "vitest";
import { BindingsResolver } from "./BindingsResolver.js";
import { StylesBindingsProcessor } from "./StylesBindingsProcessor.js";
import { createTokenReference, isTokenBinding, tokenToCssValue } from "./tokenBinding.js";
import type { DocumentElementBindings } from "./types.js";

describe("token bindings", () => {
    it("recognises a token binding and nothing else", () => {
        expect(isTokenBinding({ token: { path: "color.surface.page" } })).toBe(true);
        expect(isTokenBinding({ static: "#fff" })).toBe(false);
        expect(isTokenBinding({ expression: "$state.x" })).toBe(false);
        expect(isTokenBinding(undefined)).toBe(false);
    });

    it("derives the CSS variable from the token path", () => {
        expect(tokenToCssValue({ path: "color.action.primary.background" })).toBe(
            "var(--wby-color-action-primary-background)"
        );
    });

    it("emits the stored fallback, so content survives the theme being deactivated", () => {
        expect(tokenToCssValue({ path: "color.surface.page", fallback: "#F8FAFC" })).toBe(
            "var(--wby-color-surface-page, #F8FAFC)"
        );
    });

    it("captures the resolved value as the fallback when a reference is created", () => {
        expect(createTokenReference("color.surface.page", "#F8FAFC")).toEqual({
            path: "color.surface.page",
            fallback: "#F8FAFC"
        });
        expect(createTokenReference("color.surface.page")).toEqual({
            path: "color.surface.page"
        });
    });
});

describe("BindingsResolver with token bindings", () => {
    const resolve = (bindings: DocumentElementBindings) => {
        const resolver = new BindingsResolver({});
        const [resolved] = resolver.resolveElement({
            element: {
                type: "Webiny/Element",
                id: "el-1",
                component: { name: "Test" } as never
            },
            elementBindings: bindings,
            inputAst: []
        });
        return resolved;
    };

    it("renders a token reference as a CSS variable", () => {
        const resolved = resolve({
            styles: { backgroundColor: { token: { path: "color.surface.page" } } }
        });

        expect(resolved.styles.backgroundColor).toBe("var(--wby-color-surface-page)");
    });

    it("renders a literal unchanged", () => {
        const resolved = resolve({ styles: { backgroundColor: { static: "#123456" } } });

        expect(resolved.styles.backgroundColor).toBe("#123456");
    });

    it("renders references and literals side by side in the same element", () => {
        const resolved = resolve({
            styles: {
                backgroundColor: { token: { path: "color.surface.page", fallback: "#FFF" } },
                borderTopColor: { static: "#123456" }
            }
        });

        expect(resolved.styles.backgroundColor).toBe("var(--wby-color-surface-page, #FFF)");
        expect(resolved.styles.borderTopColor).toBe("#123456");
    });
});

describe("StylesBindingsProcessor with token bindings", () => {
    const bindings: DocumentElementBindings = {
        styles: {
            backgroundColor: { token: { path: "color.surface.page", fallback: "#FFF" } },
            borderTopColor: { static: "#123456" }
        }
    };

    const processor = () => new StylesBindingsProcessor("el-1", ["desktop", "mobile"], bindings);

    it("flattens a token binding to its CSS variable so the preview renders", () => {
        expect(processor().toDeepStyles(bindings.styles)).toEqual({
            backgroundColor: "var(--wby-color-surface-page, #FFF)",
            borderTopColor: "#123456"
        });
    });

    it("reports which properties came from tokens", () => {
        expect(processor().toTokenMap(bindings.styles)).toEqual({
            backgroundColor: { path: "color.surface.page", fallback: "#FFF" }
        });
    });

    it("writes a token reference rather than a literal when one is supplied", () => {
        const update = processor().createUpdate(
            { backgroundColor: "var(--wby-color-surface-raised)" },
            "desktop",
            { backgroundColor: { path: "color.surface.raised" } }
        );

        const document = { bindings: { "el-1": {} } } as never;
        update.applyToDocument(document);

        expect((document as any).bindings["el-1"].styles.backgroundColor).toEqual({
            token: { path: "color.surface.raised" }
        });
    });

    it("replaces a reference with a literal when no token is supplied", () => {
        const update = processor().createUpdate({ backgroundColor: "#00FF00" }, "desktop");

        const document = { bindings: { "el-1": {} } } as never;
        update.applyToDocument(document);

        // No stale `token` left behind — a binding holds one or the other, never both.
        expect((document as any).bindings["el-1"].styles.backgroundColor).toEqual({
            static: "#00FF00"
        });
    });
});
