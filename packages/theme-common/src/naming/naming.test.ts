import { describe, expect, it } from "vitest";
import { CANONICAL_SLOTS } from "~/canonical/index.js";
import { kebabCase, toCssVariableName, toTypographyCssVariableName } from "./cssVariable.js";
import { createTokenKey, isValidTokenKey, slugifyTokenKey } from "./tokenKey.js";

describe("toCssVariableName", () => {
    it("matches the naming convention documented in the design brief", () => {
        expect(toCssVariableName("color.surface.page")).toBe("--wby-color-surface-page");
        expect(toCssVariableName("color.action.primary.background")).toBe(
            "--wby-color-action-primary-background"
        );
        expect(toCssVariableName("space.lg")).toBe("--wby-space-lg");
        expect(toCssVariableName("radius.md")).toBe("--wby-radius-md");
        expect(toCssVariableName("shadow.lg")).toBe("--wby-shadow-lg");
    });

    it("hyphenates camelCase segments", () => {
        expect(toCssVariableName("type.bodySmall")).toBe("--wby-type-body-small");
    });

    it("uses the --wby- prefix so it cannot shadow the existing --wb- variables", () => {
        for (const slot of CANONICAL_SLOTS) {
            const name = toCssVariableName(slot.path);
            expect(name.startsWith("--wby-")).toBe(true);
            expect(name.startsWith("--wb-")).toBe(false);
        }
    });

    it("produces a unique variable name for every canonical slot", () => {
        const names = CANONICAL_SLOTS.map(slot => toCssVariableName(slot.path));
        expect(new Set(names).size).toBe(names.length);
    });

    it("rejects an empty path", () => {
        expect(() => toCssVariableName("")).toThrow();
    });
});

describe("toTypographyCssVariableName", () => {
    it("flattens a composite to one variable per sub-property", () => {
        expect(toTypographyCssVariableName("type.heading.1", "fontFamily")).toBe(
            "--wby-type-heading-1-family"
        );
        expect(toTypographyCssVariableName("type.heading.1", "fontSize")).toBe(
            "--wby-type-heading-1-size"
        );
        expect(toTypographyCssVariableName("type.heading.1", "fontWeight")).toBe(
            "--wby-type-heading-1-weight"
        );
        expect(toTypographyCssVariableName("type.heading.1", "lineHeight")).toBe(
            "--wby-type-heading-1-line-height"
        );
        expect(toTypographyCssVariableName("type.heading.1", "letterSpacing")).toBe(
            "--wby-type-heading-1-letter-spacing"
        );
    });
});

describe("kebabCase", () => {
    it("splits camelCase and acronym boundaries", () => {
        expect(kebabCase("bodySmall")).toBe("body-small");
        expect(kebabCase("HTMLBlock")).toBe("html-block");
        expect(kebabCase("already-kebab")).toBe("already-kebab");
        expect(kebabCase("3xl")).toBe("3xl");
    });
});

describe("token keys", () => {
    it("slugifies a display name", () => {
        expect(slugifyTokenKey("Signal 600")).toBe("signal-600");
        expect(slugifyTokenKey("Ink/900")).toBe("ink-900");
        expect(slugifyTokenKey("Grün")).toBe("grun");
        expect(slugifyTokenKey("brandBlue")).toBe("brand-blue");
    });

    it("is deterministic, so re-running extraction does not churn variable names", () => {
        expect(createTokenKey("Signal 600")).toBe(createTokenKey("Signal 600"));
    });

    it("disambiguates collisions", () => {
        expect(createTokenKey("Signal", { existingKeys: ["signal"] })).toBe("signal-2");
        expect(createTokenKey("Signal", { existingKeys: ["signal", "signal-2"] })).toBe("signal-3");
    });

    it("rejects a display name with nothing to slugify", () => {
        expect(() => createTokenKey("···")).toThrow(/no alphanumeric characters/);
    });

    it("validates key shape", () => {
        expect(isValidTokenKey("signal-600")).toBe(true);
        expect(isValidTokenKey("Signal")).toBe(false);
        expect(isValidTokenKey("signal--600")).toBe(false);
        expect(isValidTokenKey("")).toBe(false);
    });
});
