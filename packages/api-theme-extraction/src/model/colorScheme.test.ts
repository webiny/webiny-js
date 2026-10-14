import { describe, expect, it } from "vitest";
import { decideColorScheme } from "./colorScheme.js";

const LIGHT_ONLY = { colorScheme: "single", defaultMode: "light" };
const DUAL = { colorScheme: "light-dark", defaultMode: "system" };

describe("decideColorScheme", () => {
    it("ships a dark palette when the page turned dark and dark values were kept", () => {
        expect(
            decideColorScheme({ probed: true, backgroundDrop: 0.9, hasDarkVariant: true }, 12)
        ).toEqual(DUAL);
    });

    /*
     * 71westlandapts.com, 2026-10-13: the probe fired, no dark value survived, and the theme shipped
     * Webiny's default dark palette with defaultMode "system", so the editor opened the site in a dark
     * blue it never had.
     */
    it("stays light-only when the probe fired but no dark value was kept", () => {
        expect(
            decideColorScheme({ probed: true, backgroundDrop: 0.4, hasDarkVariant: true }, 0)
        ).toEqual(LIGHT_ONLY);
    });

    it("stays light-only for a single-scheme site, whatever came back", () => {
        expect(
            decideColorScheme(
                { probed: true, backgroundDrop: 0.02, hasDarkVariant: false, singleScheme: true },
                5
            )
        ).toEqual(LIGHT_ONLY);
    });

    it("stays light-only when dark mode was never probed", () => {
        expect(decideColorScheme({ probed: false }, 5)).toEqual(LIGHT_ONLY);
    });
});
