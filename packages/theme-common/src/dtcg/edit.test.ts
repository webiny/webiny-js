import { describe, expect, it } from "vitest";
import { createDefaultThemeDocument } from "~/defaults/defaultTheme.js";
import { getTokenAtPath } from "./traverse.js";
import { META_EXTENSION, MODES_EXTENSION, type TokenDocument } from "./types.js";
import {
    applyRamp,
    removeNodeAtPath,
    setNodeAtPath,
    setTokenFluid,
    setTokenReference,
    setTokenValue,
    setTypographySubProperty
} from "./edit.js";

const document: TokenDocument = {
    color: {
        $type: "color",
        brand: { signal: { $value: "#1F6FEB" } },
        surface: {
            page: {
                $value: "#FFFFFF",
                $extensions: { [MODES_EXTENSION]: { dark: "#0F172A" } }
            }
        }
    }
};

describe("setTokenValue", () => {
    it("sets the light value without touching the dark override", () => {
        const next = setTokenValue(document, "color.surface.page", "light", "#F8FAFC");

        expect(getTokenAtPath(next, "color.surface.page")?.$value).toBe("#F8FAFC");
        expect(
            getTokenAtPath(next, "color.surface.page")?.$extensions?.[MODES_EXTENSION]?.dark
        ).toBe("#0F172A");
    });

    it("sets the dark override without touching the light value", () => {
        const next = setTokenValue(document, "color.surface.page", "dark", "#000000");

        expect(getTokenAtPath(next, "color.surface.page")?.$value).toBe("#FFFFFF");
        expect(
            getTokenAtPath(next, "color.surface.page")?.$extensions?.[MODES_EXTENSION]?.dark
        ).toBe("#000000");
    });

    it("clears the dark override, falling the token back to light", () => {
        const next = setTokenValue(document, "color.surface.page", "dark", undefined);
        const token = getTokenAtPath(next, "color.surface.page");

        expect(token?.$value).toBe("#FFFFFF");
        expect(token?.$extensions?.[MODES_EXTENSION]).toBeUndefined();
    });

    it("adds a dark override to a token that had none", () => {
        const next = setTokenValue(document, "color.brand.signal", "dark", "#60A5FA");

        expect(
            getTokenAtPath(next, "color.brand.signal")?.$extensions?.[MODES_EXTENSION]?.dark
        ).toBe("#60A5FA");
    });

    it("never mutates the input document", () => {
        const before = structuredClone(document);
        setTokenValue(document, "color.surface.page", "light", "#F8FAFC");

        expect(document).toEqual(before);
    });

    it("refuses to set a value on a token that does not exist", () => {
        expect(() => setTokenValue(document, "color.nope", "light", "#000")).toThrow(
            /no such token/
        );
    });

    it("refuses to clear the light value", () => {
        expect(() => setTokenValue(document, "color.brand.signal", "light", undefined)).toThrow();
    });

    it("preserves editor metadata on the token", () => {
        const seeded = createDefaultThemeDocument();
        const before = getTokenAtPath(seeded, "text.3xl")?.$extensions;

        const next = setTokenValue(seeded, "text.3xl", "light", "3rem");

        expect(getTokenAtPath(next, "text.3xl")?.$extensions).toEqual(before);
        expect(getTokenAtPath(next, "text.3xl")?.$value).toBe("3rem");
    });
});

describe("setTokenFluid", () => {
    it("collapses max onto min when scaling is turned off", () => {
        const seeded = createDefaultThemeDocument();
        const next = setTokenFluid(seeded, "text.3xl", {
            min: "2rem",
            max: "3rem",
            enabled: false
        });

        const fluid = getTokenAtPath(next, "text.3xl")?.$extensions?.[META_EXTENSION]?.fluid;
        expect(fluid).toEqual({ min: "2rem", max: "2rem", enabled: false });
    });

    it("keeps both ends when scaling is on", () => {
        const seeded = createDefaultThemeDocument();
        const next = setTokenFluid(seeded, "text.3xl", {
            min: "2rem",
            max: "3rem",
            enabled: true
        });

        expect(getTokenAtPath(next, "text.3xl")?.$extensions?.[META_EXTENSION]?.fluid).toEqual({
            min: "2rem",
            max: "3rem",
            enabled: true
        });
    });

    it("keeps $value tracking the minimum for consumers that ignore fluid metadata", () => {
        const seeded = createDefaultThemeDocument();
        const next = setTokenFluid(seeded, "text.3xl", {
            min: "2rem",
            max: "3rem",
            enabled: true
        });

        expect(getTokenAtPath(next, "text.3xl")?.$value).toBe("2rem");
    });
});

describe("setTypographySubProperty", () => {
    it("changes one sub-property and leaves the rest alone", () => {
        const seeded = createDefaultThemeDocument();
        const next = setTypographySubProperty(seeded, "type.body", "fontWeight", 600);

        const read = (document: TokenDocument) =>
            getTokenAtPath(document, "type.body")?.$value as unknown as Record<string, unknown>;

        expect(read(next).fontWeight).toBe(600);
        expect(read(next).fontSize).toBe(read(seeded).fontSize);
    });

    it("refuses a token that is not a composite", () => {
        const seeded = createDefaultThemeDocument();
        expect(() => setTypographySubProperty(seeded, "space.md", "fontWeight", 600)).toThrow(
            /not a composite/
        );
    });
});

describe("applyRamp", () => {
    it("writes every generated step back in one pass", () => {
        const seeded = createDefaultThemeDocument();
        const next = applyRamp(seeded, "text", [
            { step: "md", min: "1.5rem", max: "1.5rem", enabled: false },
            { step: "lg", min: "2rem", max: "2.5rem", enabled: true }
        ]);

        expect(getTokenAtPath(next, "text.md")?.$value).toBe("1.5rem");
        expect(getTokenAtPath(next, "text.lg")?.$extensions?.[META_EXTENSION]?.fluid).toEqual({
            min: "2rem",
            max: "2.5rem",
            enabled: true
        });
    });

    it("skips a step the document does not declare", () => {
        const seeded = createDefaultThemeDocument();
        const next = applyRamp(seeded, "text", [
            { step: "4xl", min: "4rem", max: "4rem", enabled: false }
        ]);

        expect(getTokenAtPath(next, "text.4xl")).toBeUndefined();
    });
});

describe("setTokenReference", () => {
    it("repoints a slot at a primitive", () => {
        const next = setTokenReference(
            document,
            "color.surface.page",
            "light",
            "color.brand.signal"
        );

        expect(getTokenAtPath(next, "color.surface.page")?.$value).toBe("{color.brand.signal}");
    });
});

describe("setNodeAtPath / removeNodeAtPath", () => {
    it("creates intermediate groups on the way to a new token", () => {
        const next = setNodeAtPath(document, "color.feedback.info.background", {
            $value: "#EFF6FF"
        });

        expect(getTokenAtPath(next, "color.feedback.info.background")?.$value).toBe("#EFF6FF");
        expect(getTokenAtPath(next, "color.brand.signal")?.$value).toBe("#1F6FEB");
    });

    it("removes a token and leaves its siblings alone", () => {
        const next = removeNodeAtPath(document, "color.brand.signal");

        expect(getTokenAtPath(next, "color.brand.signal")).toBeUndefined();
        expect(getTokenAtPath(next, "color.surface.page")).toBeDefined();
    });

    it("treats a missing path as a no-op", () => {
        expect(removeNodeAtPath(document, "color.nope.deeper")).toBe(document);
    });

    it("rejects an empty path", () => {
        expect(() => setNodeAtPath(document, "", { $value: "#000" })).toThrow();
    });
});
