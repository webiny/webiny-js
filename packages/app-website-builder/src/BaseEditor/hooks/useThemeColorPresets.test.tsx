// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { WebsiteBuilderTheme } from "@webiny/website-builder-sdk";
import { ThemeProvider } from "~/BaseEditor/components/ThemeProvider.js";
import { useThemeColorPresets } from "./useThemeColorPresets.js";

const theme = (colors: WebsiteBuilderTheme["colors"]): WebsiteBuilderTheme => ({
    breakpoints: [],
    colors,
    typography: {}
});

function presetsFor(value: WebsiteBuilderTheme | undefined) {
    return renderHook(() => useThemeColorPresets(), {
        wrapper: ({ children }) => <ThemeProvider theme={value}>{children}</ThemeProvider>
    }).result.current;
}

describe("useThemeColorPresets", () => {
    it("offers the theme's colors as given, var() references included", () => {
        const colors = [
            { id: "color-primary", label: "Primary", value: "var(--wb-theme-color-primary)" },
            { id: "accent", label: "Accent", value: "#ff6600" }
        ];
        expect(presetsFor(theme(colors))).toEqual(colors);
    });

    it("offers nothing when the theme has no colors", () => {
        expect(presetsFor(theme([]))).toBeUndefined();
    });

    it("offers nothing before the frontend has sent a theme", () => {
        expect(presetsFor(undefined)).toBeUndefined();
    });

    it("offers nothing outside the editor's theme provider", () => {
        expect(renderHook(() => useThemeColorPresets()).result.current).toBeUndefined();
    });
});
