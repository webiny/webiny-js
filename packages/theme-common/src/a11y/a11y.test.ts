import { describe, expect, it } from "vitest";
import type { ResolvedToken } from "~/resolve/alias.js";
import type { TokenPath } from "~/dtcg/types.js";
import { compositeOver, contrastRatio, parseColor } from "./color.js";
import { CONTRAST_PAIRS, checkContrast, findContrastFailures } from "./contrast.js";
import { checkZoomConformance, findZoomWarnings, MAX_FLUID_RATIO } from "./zoom.js";

const resolved = (entries: Record<TokenPath, string>): Map<TokenPath, ResolvedToken> => {
    return new Map(
        Object.entries(entries).map(([path, value]) => [path, { path, type: "color", value }])
    );
};

describe("parseColor", () => {
    it("parses hex in every length", () => {
        expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
        expect(parseColor("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
        expect(parseColor("#0F172A")).toEqual({ r: 15, g: 23, b: 42, a: 1 });
        expect(parseColor("#00000080")?.a).toBeCloseTo(0.502, 3);
    });

    it("parses rgb and rgba", () => {
        expect(parseColor("rgb(15, 23, 42)")).toEqual({ r: 15, g: 23, b: 42, a: 1 });
        expect(parseColor("rgba(0, 0, 0, 0.5)")).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
        expect(parseColor("rgb(0 0 0 / 50%)")).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
    });

    it("treats transparent as fully transparent black", () => {
        expect(parseColor("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    });

    it("returns null rather than guessing at formats it does not understand", () => {
        expect(parseColor("rebeccapurple")).toBeNull();
        expect(parseColor("hsl(210, 40%, 50%)")).toBeNull();
        expect(parseColor("var(--wby-color-surface-page)")).toBeNull();
        expect(parseColor(42)).toBeNull();
        expect(parseColor(undefined)).toBeNull();
    });
});

describe("contrastRatio", () => {
    it("matches the known WCAG extremes", () => {
        const white = parseColor("#FFFFFF")!;
        const black = parseColor("#000000")!;

        expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
        expect(contrastRatio(white, white)).toBeCloseTo(1, 5);
    });

    it("is symmetric", () => {
        const a = parseColor("#1F6FEB")!;
        const b = parseColor("#FFFFFF")!;

        expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 6);
    });

    it("composites a translucent foreground over its background", () => {
        const half = parseColor("rgba(0, 0, 0, 0.5)")!;
        const white = parseColor("#FFFFFF")!;

        expect(compositeOver(half, white)).toEqual({ r: 127.5, g: 127.5, b: 127.5, a: 1 });
        expect(contrastRatio(half, white)).toBeLessThan(contrastRatio(parseColor("#000")!, white));
    });
});

describe("checkContrast", () => {
    it("passes a high-contrast pair", () => {
        const warnings = checkContrast(
            resolved({ "color.text.primary": "#000000", "color.surface.page": "#FFFFFF" }),
            "light"
        );

        const warning = warnings.find(
            candidate => candidate.pair.foreground === "color.text.primary"
        )!;
        expect(warning.status).toBe("pass");
        expect(warning.ratio).toBeCloseTo(21, 1);
    });

    it("fails a low-contrast pair and says by how much", () => {
        const warnings = checkContrast(
            resolved({ "color.text.primary": "#BBBBBB", "color.surface.page": "#FFFFFF" }),
            "light"
        );

        const warning = warnings.find(
            candidate => candidate.pair.foreground === "color.text.primary"
        )!;
        expect(warning.status).toBe("fail");
        expect(warning.message).toContain("below the 4.5:1 minimum");
    });

    it("reports not-checked rather than inventing a ratio for an unresolved token", () => {
        const warnings = checkContrast(new Map(), "light");
        expect(warnings.every(warning => warning.status === "not-checked")).toBe(true);
        expect(warnings[0].ratio).toBeUndefined();
    });

    it("reports not-checked for a colour format it cannot parse", () => {
        const warnings = checkContrast(
            resolved({
                "color.text.primary": "hsl(0, 0%, 0%)",
                "color.surface.page": "#FFFFFF"
            }),
            "light"
        );

        const warning = warnings.find(
            candidate => candidate.pair.foreground === "color.text.primary"
        )!;
        expect(warning.status).toBe("not-checked");
    });

    it("only pairs slots the schema knows are meant to sit together", () => {
        const paths = new Set(CONTRAST_PAIRS.flatMap(pair => [pair.foreground, pair.background]));

        expect(paths.has("color.surface.overlay")).toBe(false);
        // `text.inverse` has no canonical background, so pairing it would be a guess.
        expect(paths.has("color.text.inverse")).toBe(false);
        expect(CONTRAST_PAIRS.every(pair => pair.minRatio === 4.5 || pair.minRatio === 3)).toBe(
            true
        );
    });
});

describe("findContrastFailures", () => {
    it("returns failures from both modes and nothing else", () => {
        const light = resolved({
            "color.text.primary": "#000000",
            "color.surface.page": "#FFFFFF"
        });
        const dark = resolved({
            "color.text.primary": "#333333",
            "color.surface.page": "#000000"
        });

        const failures = findContrastFailures({ light, dark });

        expect(failures.every(failure => failure.status === "fail")).toBe(true);
        expect(failures.some(failure => failure.mode === "dark")).toBe(true);
    });
});

describe("checkZoomConformance", () => {
    it("ignores fixed steps", () => {
        expect(
            checkZoomConformance({
                path: "text.md",
                step: { min: "1rem", max: "4rem", enabled: false }
            })
        ).toBeNull();
    });

    it("passes a step within the ratio", () => {
        expect(
            checkZoomConformance({
                path: "text.xl",
                step: { min: "1rem", max: "2rem", enabled: true }
            })
        ).toBeNull();
    });

    it("passes a step exactly at the ratio", () => {
        expect(
            checkZoomConformance({
                path: "text.xl",
                step: { min: "1rem", max: "2.5rem", enabled: true }
            })
        ).toBeNull();
    });

    it("warns above the ratio", () => {
        const warning = checkZoomConformance({
            path: "text.3xl",
            step: { min: "1rem", max: "3rem", enabled: true }
        });

        expect(warning?.ratio).toBe(3);
        expect(warning?.maxRatio).toBe(MAX_FLUID_RATIO);
        expect(warning?.message).toContain("200%");
    });

    it("honours an overridden threshold", () => {
        expect(
            checkZoomConformance(
                { path: "text.3xl", step: { min: "1rem", max: "3rem", enabled: true } },
                4
            )
        ).toBeNull();
    });

    it("stays silent on lengths it cannot parse", () => {
        expect(
            checkZoomConformance({
                path: "text.xl",
                step: { min: "medium", max: "large", enabled: true }
            })
        ).toBeNull();
    });

    it("collects warnings across a ramp", () => {
        const warnings = findZoomWarnings([
            { path: "text.lg", step: { min: "1rem", max: "1.5rem", enabled: true } },
            { path: "text.3xl", step: { min: "1rem", max: "4rem", enabled: true } }
        ]);

        expect(warnings.map(warning => warning.path)).toEqual(["text.3xl"]);
    });
});
