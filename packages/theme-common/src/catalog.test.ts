import { describe, expect, it } from "vitest";
import { getTokenCatalog } from "./catalog.js";

describe("getTokenCatalog", () => {
    const catalog = getTokenCatalog();
    const byVariable = new Map(catalog.map(entry => [entry.variable, entry]));

    it("every entry is a --wby- custom property with a non-empty fallback", () => {
        expect(catalog.length).toBeGreaterThan(0);
        for (const entry of catalog) {
            expect(entry.variable.startsWith("--wby-")).toBe(true);
            expect(entry.fallback).not.toBe("");
        }
    });

    it("exposes semantic colour slots with their resolved hex as the fallback", () => {
        const primary = byVariable.get("--wby-color-action-primary-background");
        expect(primary).toBeDefined();
        expect(primary?.fallback).toMatch(/^#[0-9a-fA-F]{3,8}$/);
        expect(primary?.group).toBe("color");
        // Colour slots carry usage guidance, unlike bare ramp steps.
        expect(primary?.description.length).toBeGreaterThan(0);
    });

    it("flattens a typography role into its sub-property variables", () => {
        const bodyVars = catalog.filter(entry => entry.path === "type.body").map(e => e.variable);
        expect(bodyVars).toEqual(
            expect.arrayContaining([
                "--wby-type-body-family",
                "--wby-type-body-size",
                "--wby-type-body-weight",
                "--wby-type-body-line-height",
                "--wby-type-body-letter-spacing"
            ])
        );
    });

    it("includes the non-colour semantic roles and the ramp steps", () => {
        expect(byVariable.has("--wby-radius-control")).toBe(true); // semantic role
        expect(byVariable.has("--wby-shadow-raised")).toBe(true); // semantic role
        expect(byVariable.has("--wby-radius-md")).toBe(true); // ramp step
        expect(byVariable.get("--wby-radius-md")?.group).toBe("radius");
    });

    it("excludes theme-specific brand primitives", () => {
        expect(catalog.some(entry => entry.variable.startsWith("--wby-color-brand-"))).toBe(false);
    });

    it("has unique variable names", () => {
        expect(byVariable.size).toBe(catalog.length);
    });
});
