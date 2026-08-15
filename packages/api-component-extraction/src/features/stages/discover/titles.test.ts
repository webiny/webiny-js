import { describe, expect, it } from "vitest";
import { parseTitle } from "./titles.js";

describe("parseTitle", () => {
    it("extracts and trims the title", () => {
        expect(parseTitle("<html><head><title>  Home page  </title></head></html>")).toBe(
            "Home page"
        );
    });

    it("collapses whitespace and decodes entities", () => {
        expect(parseTitle("<title>Pricing &amp; plans\n  — Acme</title>")).toBe(
            "Pricing & plans — Acme"
        );
    });

    it("is case-insensitive and tolerates attributes", () => {
        expect(parseTitle('<TITLE data-x="1">Docs</TITLE>')).toBe("Docs");
    });

    it("returns null when there is no title or it is empty", () => {
        expect(parseTitle("<html><head></head></html>")).toBeNull();
        expect(parseTitle("<title>   </title>")).toBeNull();
    });
});
