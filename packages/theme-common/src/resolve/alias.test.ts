import { describe, expect, it } from "vitest";
import type { TokenDocument } from "~/dtcg/types.js";
import { MODES_EXTENSION } from "~/dtcg/types.js";
import {
    collectReferences,
    findReferrers,
    MAX_ALIAS_DEPTH,
    resolveDocument,
    resolveDocumentModes,
    valueForMode
} from "./alias.js";

const doc = (document: TokenDocument): TokenDocument => document;

describe("resolveDocument", () => {
    it("resolves a literal untouched", () => {
        const result = resolveDocument(
            doc({ color: { $type: "color", brand: { $value: "#1F6FEB" } } })
        );

        expect(result.errors).toEqual([]);
        expect(result.tokens.get("color.brand")?.value).toBe("#1F6FEB");
    });

    it("resolves a chain to its literal", () => {
        const result = resolveDocument(
            doc({
                color: {
                    $type: "color",
                    signal: { $value: "#1F6FEB" },
                    accent: { $value: "{color.signal}" },
                    action: { $value: "{color.accent}" }
                }
            })
        );

        expect(result.errors).toEqual([]);
        expect(result.tokens.get("color.action")?.value).toBe("#1F6FEB");
    });

    it("allows a chain exactly at the depth cap", () => {
        const result = resolveDocument(
            doc({
                color: {
                    $type: "color",
                    a: { $value: "#000000" },
                    b: { $value: "{color.a}" },
                    c: { $value: "{color.b}" },
                    d: { $value: "{color.c}" }
                }
            })
        );

        // color.d -> c -> b -> a is three hops.
        expect(MAX_ALIAS_DEPTH).toBe(3);
        expect(result.errors).toEqual([]);
        expect(result.tokens.get("color.d")?.value).toBe("#000000");
    });

    it("rejects a chain one hop past the cap and reports the path walked", () => {
        const result = resolveDocument(
            doc({
                color: {
                    $type: "color",
                    a: { $value: "#000000" },
                    b: { $value: "{color.a}" },
                    c: { $value: "{color.b}" },
                    d: { $value: "{color.c}" },
                    e: { $value: "{color.d}" }
                }
            })
        );

        const error = result.errors.find(candidate => candidate.path === "color.e");
        expect(error?.code).toBe("Alias/DepthExceeded");
        expect(error?.chain).toEqual(["color.e", "color.d", "color.c", "color.b", "color.a"]);
        expect(result.tokens.has("color.e")).toBe(false);
    });

    it("detects a cycle and shows the path", () => {
        const result = resolveDocument(
            doc({
                color: {
                    $type: "color",
                    a: { $value: "{color.b}" },
                    b: { $value: "{color.a}" }
                }
            })
        );

        const error = result.errors.find(candidate => candidate.path === "color.a");
        expect(error?.code).toBe("Alias/Cycle");
        expect(error?.chain).toEqual(["color.a", "color.b", "color.a"]);
    });

    it("detects a token that references itself", () => {
        const result = resolveDocument(
            doc({ color: { $type: "color", a: { $value: "{color.a}" } } })
        );

        expect(result.errors[0]?.code).toBe("Alias/Cycle");
    });

    it("does not mistake a shared target for a cycle", () => {
        const result = resolveDocument(
            doc({
                color: {
                    $type: "color",
                    base: { $value: "#FFFFFF" },
                    a: { $value: "{color.base}" },
                    b: { $value: "{color.base}" }
                }
            })
        );

        expect(result.errors).toEqual([]);
        expect(result.tokens.get("color.a")?.value).toBe("#FFFFFF");
        expect(result.tokens.get("color.b")?.value).toBe("#FFFFFF");
    });

    it("reports a missing target", () => {
        const result = resolveDocument(
            doc({ color: { $type: "color", a: { $value: "{color.nope}" } } })
        );

        expect(result.errors[0]?.code).toBe("Alias/NotFound");
        expect(result.errors[0]?.message).toContain("color.nope");
    });

    it("reports a reference to a group", () => {
        const result = resolveDocument(
            doc({
                color: {
                    $type: "color",
                    group: { inner: { $value: "#FFFFFF" } },
                    a: { $value: "{color.group}" }
                }
            })
        );

        expect(result.errors[0]?.code).toBe("Alias/TargetIsGroup");
    });

    it("enforces type compatibility across groups", () => {
        const result = resolveDocument(
            doc({
                space: { $type: "dimension", md: { $value: "1rem" } },
                color: { $type: "color", a: { $value: "{space.md}" } }
            })
        );

        const error = result.errors.find(candidate => candidate.path === "color.a");
        expect(error?.code).toBe("Alias/TypeMismatch");
        expect(error?.expectedType).toBe("color");
        expect(error?.actualType).toBe("dimension");
    });

    it("allows cross-group references within a type", () => {
        const result = resolveDocument(
            doc({
                color: {
                    $type: "color",
                    brand: { signal: { $value: "#1F6FEB" } },
                    action: { primary: { $value: "{color.brand.signal}" } }
                }
            })
        );

        expect(result.errors).toEqual([]);
        expect(result.tokens.get("color.action.primary")?.value).toBe("#1F6FEB");
    });

    it("rejects partial interpolation rather than silently treating it as a literal", () => {
        const result = resolveDocument(
            doc({ border: { $type: "dimension", a: { $value: "1px solid {color.border}" } } })
        );

        expect(result.errors[0]?.code).toBe("Alias/Malformed");
    });

    it("resolves each sub-property of a composite typography token", () => {
        const result = resolveDocument(
            doc({
                font: { $type: "fontFamily", sans: { $value: "Inter" } },
                text: { $type: "dimension", lg: { $value: "1.25rem" } },
                type: {
                    $type: "typography",
                    body: {
                        $value: {
                            fontFamily: "{font.sans}",
                            fontSize: "{text.lg}",
                            fontWeight: 400,
                            lineHeight: 1.5,
                            letterSpacing: "0rem"
                        }
                    }
                }
            })
        );

        expect(result.errors).toEqual([]);
        expect(result.tokens.get("type.body")?.value).toEqual({
            fontFamily: "Inter",
            fontSize: "1.25rem",
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: "0rem"
        });
    });

    it("reports the offending sub-property of a composite", () => {
        const result = resolveDocument(
            doc({
                type: {
                    $type: "typography",
                    body: {
                        $value: {
                            fontFamily: "{font.missing}",
                            fontSize: "1rem",
                            fontWeight: 400,
                            lineHeight: 1.5,
                            letterSpacing: "0rem"
                        }
                    }
                }
            })
        );

        expect(result.errors[0]?.code).toBe("Alias/NotFound");
        expect(result.errors[0]?.property).toBe("fontFamily");
        expect(result.tokens.has("type.body")).toBe(false);
    });

    it("resolves an alias inside a shadow layer", () => {
        const result = resolveDocument(
            doc({
                color: { $type: "color", scrim: { $value: "rgba(0, 0, 0, 0.2)" } },
                shadow: {
                    $type: "shadow",
                    md: {
                        $value: {
                            color: "{color.scrim}",
                            offsetX: "0rem",
                            offsetY: "0.25rem",
                            blur: "0.5rem",
                            spread: "0rem"
                        }
                    }
                }
            })
        );

        expect(result.errors).toEqual([]);
        expect(result.tokens.get("shadow.md")?.value).toMatchObject({
            color: "rgba(0, 0, 0, 0.2)"
        });
    });
});

describe("modes", () => {
    const document = doc({
        color: {
            $type: "color",
            page: {
                $value: "#FFFFFF",
                $extensions: { [MODES_EXTENSION]: { dark: "#0F172A" } }
            },
            surface: { $value: "{color.page}" }
        },
        space: { $type: "dimension", md: { $value: "1rem" } }
    });

    it("resolves the base value in light and the override in dark", () => {
        const { light, dark } = resolveDocumentModes(document);

        expect(light.tokens.get("color.page")?.value).toBe("#FFFFFF");
        expect(dark.tokens.get("color.page")?.value).toBe("#0F172A");
    });

    it("follows references through the dark value", () => {
        const { dark } = resolveDocumentModes(document);
        expect(dark.tokens.get("color.surface")?.value).toBe("#0F172A");
    });

    it("resolves mode-invariant tokens identically in both modes", () => {
        const { light, dark } = resolveDocumentModes(document);
        expect(light.tokens.get("space.md")?.value).toBe(dark.tokens.get("space.md")?.value);
    });

    it("falls back to the base value when a token declares no dark override", () => {
        expect(valueForMode({ $value: "#FFFFFF" }, "dark")).toBe("#FFFFFF");
    });
});

describe("reference discovery", () => {
    const document = doc({
        color: {
            $type: "color",
            brand: { signal: { $value: "#1F6FEB" }, ink: { $value: "#0B1220" } },
            link: { $value: "{color.brand.signal}" },
            focus: {
                $value: "{color.brand.signal}",
                $extensions: { [MODES_EXTENSION]: { dark: "{color.brand.ink}" } }
            }
        }
    });

    it("lists the paths a token references", () => {
        expect(collectReferences({ $value: "{color.brand.signal}" })).toEqual([
            "color.brand.signal"
        ]);
        expect(collectReferences({ $value: "#FFFFFF" })).toEqual([]);
    });

    it("finds every token pointing at a primitive, across both modes", () => {
        expect(findReferrers(document, "color.brand.signal").sort()).toEqual([
            "color.focus",
            "color.link"
        ]);
        expect(findReferrers(document, "color.brand.ink")).toEqual(["color.focus"]);
        expect(findReferrers(document, "color.brand.unused")).toEqual([]);
    });
});
