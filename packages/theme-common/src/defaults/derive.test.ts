import { describe, expect, it } from "vitest";
import {
    darken,
    deriveActionAndSurfaceStates,
    isLight,
    lighten,
    parseHex,
    shiftForState,
    withAlpha,
    type DerivationBases
} from "./derive.js";

describe("derive colour maths", () => {
    it("parses #rrggbb and #rgb, rejecting anything else", () => {
        expect(parseHex("#2563EB")).toEqual({ r: 0x25, g: 0x63, b: 0xeb });
        expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
        expect(parseHex("rgb(0,0,0)")).toBeNull();
        expect(parseHex("transparent")).toBeNull();
    });

    it("darkens toward black and lightens toward white", () => {
        expect(darken("#808080", 0.5)).toBe("#404040");
        expect(lighten("#808080", 0.5)).toBe("#C0C0C0");
        // The extremes are stable.
        expect(darken("#000000", 0.5)).toBe("#000000");
        expect(lighten("#FFFFFF", 0.5)).toBe("#FFFFFF");
    });

    it("returns a non-hex input unchanged, so `transparent` survives", () => {
        expect(darken("transparent", 0.2)).toBe("transparent");
        expect(withAlpha("transparent", 0.5)).toBe("transparent");
    });

    it("emits an rgba() string at the requested alpha", () => {
        expect(withAlpha("#020617", 0.5)).toBe("rgba(2, 6, 23, 0.5)");
    });

    it("shifts a state away from its surface: darker in light, lighter in dark", () => {
        const base = "#B91C1C";
        expect(shiftForState(base, "light", 0.12)).toBe(darken(base, 0.12));
        expect(shiftForState(base, "dark", 0.12)).toBe(lighten(base, 0.12));
    });

    it("judges perceived lightness for foreground choice", () => {
        expect(isLight("#FFFFFF")).toBe(true);
        expect(isLight("#020617")).toBe(false);
        expect(isLight("#2563EB")).toBe(false);
    });
});

describe("deriveActionAndSurfaceStates", () => {
    const bases: DerivationBases = {
        primary: { light: "#2563EB", dark: "#3B82F6" },
        secondary: { light: "#E2E8F0", dark: "#334155" },
        danger: { light: "#B00020", dark: "#7F1D1D" },
        onAction: { light: "#FFFFFF", dark: "#FFFFFF" },
        link: { light: "#1D4ED8", dark: "#60A5FA" },
        ink: { light: "#111111", dark: "#F8FAFC" },
        mutedText: { light: "#777777", dark: "#94A3B8" },
        sunkenSurface: { light: "#F1F5F9", dark: "#020617" }
    };
    const derived = deriveActionAndSurfaceStates(bases);

    it("ghost is the link accent as text on a transparent fill", () => {
        expect(derived["color.action.ghost.background"]).toEqual({
            light: "transparent",
            dark: "transparent"
        });
        expect(derived["color.action.ghost.foreground"]).toEqual({
            light: "#1D4ED8",
            dark: "#60A5FA"
        });
    });

    it("destructive is the danger colour with a legible label", () => {
        expect(derived["color.action.destructive.background"]).toEqual({
            light: "#B00020",
            dark: "#7F1D1D"
        });
        // Both danger values are dark, so white reads on them.
        expect(derived["color.action.destructive.foreground"]).toEqual({
            light: "#FFFFFF",
            dark: "#FFFFFF"
        });
    });

    it("uses the ink as the label when the danger colour is light", () => {
        const light = deriveActionAndSurfaceStates({
            ...bases,
            danger: { light: "#FECACA", dark: "#FECACA" }
        });
        expect(light["color.action.destructive.foreground"]).toEqual({
            light: "#111111",
            dark: "#F8FAFC"
        });
    });

    it("disabled follows the sunken surface and muted text", () => {
        expect(derived["color.action.disabled.background"]).toEqual({
            light: "#F1F5F9",
            dark: "#020617"
        });
        expect(derived["color.action.disabled.foreground"]).toEqual({
            light: "#777777",
            dark: "#94A3B8"
        });
    });

    it("steps hover/active off the base and builds a dark scrim on the ink", () => {
        expect(derived["color.action.primary.hover"].light).not.toBe(bases.primary.light);
        expect(derived["color.surface.scrim"]).toEqual({
            light: "rgba(17, 17, 17, 0.5)",
            dark: "rgba(0, 0, 0, 0.6)"
        });
    });
});
