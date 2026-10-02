import { describe, expect, it } from "vitest";
import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode } from "~/domain/artifacts.js";
import { sectionTypeScale, themeTypeRoles } from "./sectionTypeScale.js";

const node = (
    tag: string,
    styles: Record<string, string>,
    text?: string,
    children: CapturedNode[] = []
): CapturedNode => ({
    tag,
    box: { x: 0, y: 0, width: 400, height: 40 },
    styles,
    ...(text ? { text } : {}),
    children
});

const manifest = (roles: Array<[string, string, string]>): ThemeManifest =>
    ({
        slots: roles.map(([path, variable, size]) => ({
            path,
            displayName: path,
            description: "",
            cssVariables: [variable],
            values: { light: { fontSize: size }, dark: { fontSize: size } }
        }))
    }) as unknown as ThemeManifest;

const THEME = manifest([
    ["type.h1", "--wby-type-h1-font-size", "3.75rem"],
    ["type.body", "--wby-type-body-font-size", "1rem"]
]);

describe("sectionTypeScale", () => {
    it("reports each distinct size largest first, with its line height and usage count", () => {
        const section = node("section", {}, undefined, [
            node("h1", { fontSize: "60px", lineHeight: "66px" }, "Heading"),
            node("p", { fontSize: "16px", lineHeight: "24px" }, "One"),
            node("p", { fontSize: "16px", lineHeight: "24px" }, "Two")
        ]);

        expect(sectionTypeScale(section, THEME)).toEqual([
            {
                fontSize: 60,
                lineHeight: 66,
                elements: 1,
                token: { path: "type.h1", cssVariable: "--wby-type-h1-font-size", fontSize: 60 }
            },
            {
                fontSize: 16,
                lineHeight: 24,
                elements: 2,
                token: { path: "type.body", cssVariable: "--wby-type-body-font-size", fontSize: 16 }
            }
        ]);
    });

    it("reports no token when the theme has nothing near the measured size", () => {
        // The signal that theme extraction missed the site's scale, rather than a size to force into
        // the nearest role — a 38px heading bound to a 60px h1 is the defect wearing a token.
        const section = node("section", {}, undefined, [
            node("h2", { fontSize: "38px", lineHeight: "44px" }, "Heading")
        ]);

        expect(sectionTypeScale(section, THEME)[0].token).toBeNull();
    });

    it("ignores elements with no text and elements with no box", () => {
        const section = node("section", {}, undefined, [
            node("div", { fontSize: "99px" }, undefined, []),
            {
                ...node("span", { fontSize: "80px" }, "Hidden"),
                box: { x: 0, y: 0, width: 0, height: 0 }
            }
        ]);

        expect(sectionTypeScale(section, THEME)).toEqual([]);
    });

    it("treats sizes within a pixel as one step", () => {
        const section = node("section", {}, undefined, [
            node("p", { fontSize: "16px" }, "a"),
            node("p", { fontSize: "16.4px" }, "b")
        ]);

        const scale = sectionTypeScale(section, THEME);
        expect(scale).toHaveLength(1);
        expect(scale[0].elements).toBe(2);
    });

    it("works with no manifest, reporting every size as untokenised", () => {
        const section = node("section", {}, undefined, [node("h1", { fontSize: "60px" }, "x")]);
        expect(sectionTypeScale(section, null)[0].token).toBeNull();
    });
});

describe("themeTypeRoles", () => {
    it("reads a role's size through rem and prefers the font-size variable", () => {
        expect(themeTypeRoles(THEME)).toEqual([
            { path: "type.h1", cssVariable: "--wby-type-h1-font-size", fontSize: 60 },
            { path: "type.body", cssVariable: "--wby-type-body-font-size", fontSize: 16 }
        ]);
    });

    it("skips slots that carry no font size, such as colours", () => {
        const colours = manifest([]) as ThemeManifest;
        (colours as unknown as { slots: unknown[] }).slots = [
            { path: "color.bg", cssVariables: ["--wby-color-bg"], values: { light: "#fff" } }
        ];
        expect(themeTypeRoles(colours)).toEqual([]);
    });
});
