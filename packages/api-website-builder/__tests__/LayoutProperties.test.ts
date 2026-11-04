import { describe, expect, it } from "vitest";
import { LayoutProperties } from "~/domain/layout/LayoutProperties.js";
import { LayoutSlug } from "~/domain/layout/LayoutSlug.js";

describe("LayoutSlug", () => {
    it("is made from a title", () => {
        expect(LayoutSlug.fromTitle("  Blog Post (EN) ").toString()).toBe("blog-post-en");
        expect(LayoutSlug.fromTitle("Čćžšđ layout").toString()).toBe("cczs-layout");
        expect(LayoutSlug.fromTitle("!!!").toString()).toBe("layout");
    });

    it("accepts lowercase letters, numbers and hyphens between them", () => {
        expect(LayoutSlug.from("blog-post-2").validate()).toBeNull();
        expect(LayoutSlug.from("").validate()).not.toBeNull();
        expect(LayoutSlug.from("Blog").validate()).not.toBeNull();
        expect(LayoutSlug.from("blog--post").validate()).not.toBeNull();
        expect(LayoutSlug.from("-blog").validate()).not.toBeNull();
        expect(LayoutSlug.from("blog_post").validate()).not.toBeNull();
    });

    it("names its copies and its candidates", () => {
        const slug = LayoutSlug.from("blog");
        expect(slug.copy().toString()).toBe("blog-copy");
        expect(slug.candidate(1).toString()).toBe("blog");
        expect(slug.candidate(3).toString()).toBe("blog-3");
    });
});

describe("LayoutProperties.create", () => {
    it("trims the title, and drops a sent source layout and an empty language", () => {
        const properties = LayoutProperties.create({
            title: "  Blog  ",
            sourceLayout: "other",
            language: null
        });
        expect(properties.validate()).toBeNull();
        expect(properties.toJSON()).toEqual({ title: "Blog" });
    });

    it("needs an object with a title and, if given, a language code", () => {
        expect(LayoutProperties.create([]).validate()).toBe("`properties` must be an object.");
        expect(LayoutProperties.create({ title: " " }).validate()).toBe(
            "`properties.title` must be a non-empty string."
        );
        expect(LayoutProperties.create({ title: "Blog", language: "" }).validate()).toBe(
            "`properties.language` must be a language code."
        );
    });
});

describe("LayoutProperties slugs", () => {
    it("checks a sent slug, and leaves out one that isn't sent", () => {
        expect(LayoutProperties.create({ title: "Blog", slug: " blog " }).slug()?.toString()).toBe(
            "blog"
        );
        expect(LayoutProperties.create({ title: "Blog" }).slug()).toBeNull();
        expect(LayoutProperties.create({ title: "Blog", slug: "Blog!" }).validate()).not.toBeNull();
    });

    it("keeps a stored slug unless a new one is sent, and never removes it", () => {
        const original = { title: "Blog", slug: "blog" };
        expect(LayoutProperties.update(original, { title: "Posts" }).toJSON().slug).toBe("blog");
        expect(LayoutProperties.update(original, { slug: "posts" }).toJSON().slug).toBe("posts");
        expect(LayoutProperties.update(original, { slug: null }).validate()).toBe(
            "`properties.slug` can be changed, not removed."
        );
        expect(LayoutProperties.update({ title: "Old" }, { slug: "" }).toJSON()).toEqual({
            title: "Old"
        });
    });

    it("gives a language version no slug", () => {
        const properties = LayoutProperties.update(
            { title: "Blog", language: "de", sourceLayout: "source" },
            { slug: "blog-de" }
        );
        expect(properties.toJSON().slug).toBeUndefined();
    });
});

describe("LayoutProperties.update", () => {
    it("keeps the stored title for an empty one", () => {
        const properties = LayoutProperties.update(
            { title: "Blog", language: "en" },
            { title: "" }
        );
        expect(properties.toJSON()).toEqual({ title: "Blog", language: "en" });
    });

    it("keeps a language version's source and language", () => {
        const properties = LayoutProperties.update(
            { title: "Blog", language: "de", sourceLayout: "source" },
            { title: "Blog DE", language: "fr", sourceLayout: "other" }
        );
        expect(properties.toJSON()).toEqual({
            title: "Blog DE",
            language: "de",
            sourceLayout: "source"
        });
    });

    it("rejects a title that isn't a string, and a language that isn't a code", () => {
        expect(LayoutProperties.update({ title: "Blog" }, { title: 1 }).validate()).toBe(
            "`properties.title` must be a string."
        );
        expect(LayoutProperties.update({ title: "Blog" }, { language: 1 }).validate()).toBe(
            "`properties.language` must be a language code."
        );
    });
});
