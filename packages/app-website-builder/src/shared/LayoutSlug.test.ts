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
        expect(typed.validate()).not.toBeNull();
        expect(typed.complete().toString()).toBe("blog-post");
        expect(typed.complete().validate()).toBeNull();
        expect(LayoutSlug.fromInput("--a__b").toString()).toBe("a-b");
    });

    it("validates, numbers and copies a slug as the API does", () => {
        expect(LayoutSlug.from(" blog ").validate()).toBeNull();
        expect(LayoutSlug.from("").validate()).toBe(
            "`properties.slug` must be a non-empty string."
        );
        expect(LayoutSlug.from("Blog Post").validate()).not.toBeNull();
        expect(LayoutSlug.from("blog").candidate(1).toString()).toBe("blog");
        expect(LayoutSlug.from("blog").candidate(3).toString()).toBe("blog-3");
        expect(LayoutSlug.from("blog").copy().toString()).toBe("blog-copy");
        expect(LayoutSlug.from("blog").equals(LayoutSlug.fromTitle("Blog"))).toBe(true);
    });
});
