import { describe, expect, it } from "vitest";
import { LayoutSlug } from "./LayoutSlug.js";

describe("LayoutSlug", () => {
    it("is made from a title", () => {
        expect(LayoutSlug.fromTitle("  Blog Post (EN) ").toString()).toBe("blog-post-en");
        expect(LayoutSlug.fromTitle("Čćžš layout").toString()).toBe("cczs-layout");
        expect(LayoutSlug.fromTitle("!!!").toString()).toBe("layout");
    });

    it("keeps a trailing hyphen while it's typed, and drops it when complete", () => {
        const typed = LayoutSlug.fromInput("Blog Post ");
        expect(typed.toString()).toBe("blog-post-");
        expect(typed.isValid()).toBe(false);
        expect(typed.complete().toString()).toBe("blog-post");
        expect(typed.complete().isValid()).toBe(true);
        expect(LayoutSlug.fromInput("--a__b").toString()).toBe("a-b");
    });
});
