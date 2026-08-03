import { describe, expect, it } from "vitest";
import { createDefaultThemeDocument } from "~/defaults/defaultTheme.js";
import {
    childNames,
    isAlias,
    isDesignToken,
    isReservedKey,
    isShadowValue,
    isTokenGroup,
    isTypographyValue,
    parseAlias,
    toAlias
} from "./guards.js";
import { validateTokenDocument } from "./schema.js";
import {
    collectTokens,
    getEffectiveType,
    getNodeAtPath,
    getTokenAtPath,
    walkTokens
} from "./traverse.js";
import { isModeVaryingType, type TokenDocument } from "./types.js";

const document: TokenDocument = {
    color: {
        $type: "color",
        brand: { signal: { $value: "#1F6FEB" } },
        link: { $value: "{color.brand.signal}" }
    },
    space: {
        $type: "dimension",
        md: { $value: "1rem", $type: "dimension" },
        lg: { $value: "1.5rem" }
    }
};

describe("guards", () => {
    it("distinguishes tokens from groups", () => {
        expect(isDesignToken({ $value: "#fff" })).toBe(true);
        expect(isDesignToken({ nested: { $value: "#fff" } })).toBe(false);
        expect(isTokenGroup({ nested: { $value: "#fff" } })).toBe(true);
        expect(isTokenGroup({ $value: "#fff" })).toBe(false);
        expect(isDesignToken(null)).toBe(false);
        expect(isDesignToken([])).toBe(false);
    });

    it("recognises only whole-string aliases", () => {
        expect(isAlias("{color.brand.signal}")).toBe(true);
        expect(isAlias("1px solid {color.border}")).toBe(false);
        expect(isAlias("{}")).toBe(false);
        expect(isAlias("#FFFFFF")).toBe(false);
    });

    it("round-trips a path through the alias syntax", () => {
        expect(parseAlias(toAlias("color.brand.signal"))).toBe("color.brand.signal");
        expect(parseAlias("#FFFFFF")).toBeNull();
        expect(parseAlias(42)).toBeNull();
    });

    it("treats $-prefixed keys as metadata", () => {
        expect(isReservedKey("$value")).toBe(true);
        expect(isReservedKey("value")).toBe(false);
        expect(childNames(document.color as never)).toEqual(["brand", "link"]);
    });

    it("recognises composite values", () => {
        expect(
            isTypographyValue({
                fontFamily: "Inter",
                fontSize: "1rem",
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: "0rem"
            })
        ).toBe(true);
        expect(isTypographyValue({ fontFamily: "Inter" })).toBe(false);

        expect(
            isShadowValue({
                color: "#000",
                offsetX: "0rem",
                offsetY: "0rem",
                blur: "0rem",
                spread: "0rem"
            })
        ).toBe(true);
        expect(isShadowValue([])).toBe(false);
    });

    it("marks only colour and shadow as mode-varying", () => {
        expect(isModeVaryingType("color")).toBe(true);
        expect(isModeVaryingType("shadow")).toBe(true);
        expect(isModeVaryingType("dimension")).toBe(false);
        expect(isModeVaryingType("typography")).toBe(false);
    });
});

describe("traversal", () => {
    it("resolves a path to a token or group", () => {
        expect(getTokenAtPath(document, "color.brand.signal")?.$value).toBe("#1F6FEB");
        expect(getNodeAtPath(document, "color.brand")).toBeDefined();
        expect(getTokenAtPath(document, "color.brand")).toBeUndefined();
        expect(getNodeAtPath(document, "color.nope")).toBeUndefined();
        expect(getNodeAtPath(document, "")).toBeUndefined();
    });

    it("inherits $type from the nearest ancestor group that declares one", () => {
        expect(getEffectiveType(document, "color.brand.signal")).toBe("color");
        expect(getEffectiveType(document, "space.lg")).toBe("dimension");
    });

    it("lets a token override the inherited $type", () => {
        const overridden: TokenDocument = {
            color: { $type: "color", odd: { $value: "1rem", $type: "dimension" } }
        };
        expect(getEffectiveType(overridden, "color.odd")).toBe("dimension");
    });

    it("yields every leaf and no groups", () => {
        const paths = [...walkTokens(document)].map(visited => visited.path);
        expect(paths).toEqual(["color.brand.signal", "color.link", "space.md", "space.lg"]);
    });

    it("collects tokens into a path-keyed map", () => {
        const tokens = collectTokens(document);
        expect(tokens.size).toBe(4);
        expect(tokens.get("space.md")?.type).toBe("dimension");
    });
});

describe("validateTokenDocument", () => {
    it("accepts the default theme", () => {
        const result = validateTokenDocument(createDefaultThemeDocument());
        expect(result.valid).toBe(true);
    });

    it("accepts a minimal document", () => {
        expect(validateTokenDocument(document).valid).toBe(true);
    });

    it("rejects an unknown $type", () => {
        const result = validateTokenDocument({ color: { a: { $value: "#fff", $type: "colour" } } });
        expect(result.valid).toBe(false);
    });

    it("rejects a name containing the path separator", () => {
        const result = validateTokenDocument({ color: { "brand.signal": { $value: "#fff" } } });
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(
                result.issues.some(issue => issue.message.includes("not a valid token name"))
            ).toBe(true);
        }
    });

    it("rejects a token whose $value is the wrong shape", () => {
        const result = validateTokenDocument({ color: { a: { $value: { nope: true } } } });
        expect(result.valid).toBe(false);
    });

    it("reports issues with the path to the offending node", () => {
        const result = validateTokenDocument({ space: { md: { $value: "1rem", $type: 42 } } });
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.issues[0].path).toContain("space");
        }
    });
});
