import { describe, it, expect } from "vitest";
import { PagePath } from "./PagePath.js";

describe("PagePath", () => {
    describe("fromTitle", () => {
        it("should generate a slug from title", () => {
            expect(PagePath.fromTitle("Hello World").toString()).toBe("/hello-world");
        });

        it("should remove special characters", () => {
            expect(PagePath.fromTitle("What's New?").toString()).toBe("/whats-new");
        });

        it("should handle empty title", () => {
            expect(PagePath.fromTitle("").toString()).toBe("/");
        });
    });

    describe("slugify", () => {
        it("should normalize a path", () => {
            expect(PagePath.create("/Hello World").slugify().toString()).toBe("/hello-world");
        });

        it("should preserve slashes in path segments", () => {
            expect(PagePath.create("/de/hello-world").slugify().toString()).toBe("/de/hello-world");
        });

        it("should ensure leading slash", () => {
            expect(PagePath.create("hello").slugify().toString()).toBe("/hello");
        });
    });

    describe("setLanguageCode", () => {
        const codes = ["en", "de", "fr"];

        it("should prepend language code to a bare path", () => {
            expect(PagePath.create("/demo").setLanguageCode("de", codes).toString()).toBe(
                "/de/demo"
            );
        });

        it("should replace existing language code", () => {
            expect(PagePath.create("/de/demo").setLanguageCode("fr", codes).toString()).toBe(
                "/fr/demo"
            );
        });

        it("should handle root path", () => {
            expect(PagePath.create("/").setLanguageCode("de", codes).toString()).toBe("/de");
        });

        it("should not treat non-language first segment as a code", () => {
            expect(PagePath.create("/demo/page").setLanguageCode("de", codes).toString()).toBe(
                "/de/demo/page"
            );
        });
    });

    describe("stripLanguageCode", () => {
        const codes = ["en", "de", "fr"];

        it("should strip a known language prefix", () => {
            expect(PagePath.create("/de/demo").stripLanguageCode(codes).toString()).toBe("/demo");
        });

        it("should leave path unchanged if no language prefix", () => {
            expect(PagePath.create("/demo").stripLanguageCode(codes).toString()).toBe("/demo");
        });

        it("should return root when stripping leaves nothing", () => {
            expect(PagePath.create("/de").stripLanguageCode(codes).toString()).toBe("/");
        });
    });

    describe("hasContent", () => {
        const codes = ["en", "de"];

        it("should return true for paths with content", () => {
            expect(PagePath.create("/demo").hasContent()).toBe(true);
        });

        it("should return false for root", () => {
            expect(PagePath.create("/").hasContent()).toBe(false);
        });

        it("should return false for language-only path", () => {
            expect(PagePath.create("/de").hasContent(codes)).toBe(false);
        });

        it("should return true for language-prefixed path with content", () => {
            expect(PagePath.create("/de/demo").hasContent(codes)).toBe(true);
        });
    });

    describe("isEmpty", () => {
        it("should return true for empty string", () => {
            expect(PagePath.create("").isEmpty()).toBe(true);
        });

        it("should return true for root", () => {
            expect(PagePath.create("/").isEmpty()).toBe(true);
        });

        it("should return false for path with content", () => {
            expect(PagePath.create("/demo").isEmpty()).toBe(false);
        });
    });
});
