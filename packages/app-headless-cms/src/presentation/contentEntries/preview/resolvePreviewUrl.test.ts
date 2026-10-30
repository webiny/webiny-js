import { describe, it, expect } from "vitest";
import {
    buildDisplayUrl,
    buildEditorUrl,
    getPatternRefFieldIds,
    getRefValues,
    resolveSlugPattern,
    withRefValues
} from "./resolvePreviewUrl.js";

const fields = [
    { fieldId: "slug", type: "text" },
    { fieldId: "location", type: "ref" },
    { fieldId: "tags", type: "ref" }
];

const location = { id: "loc1#0001", modelId: "location" };

describe("resolvePreviewUrl", () => {
    it("should resolve plain values and fall back to `new` for missing ones", () => {
        expect(resolveSlugPattern("/articles/{values.slug}", { values: { slug: "hello" } })).toBe(
            "/articles/hello"
        );
        expect(resolveSlugPattern("/articles/{values.slug}", { values: {} })).toBe("/articles/new");
    });

    it("should build the iframe url from the static prefix only", () => {
        expect(buildEditorUrl("https://site.com/", "/articles/{values.slug}")).toBe(
            "https://site.com/articles/preview"
        );
        expect(buildEditorUrl("https://site.com", "/{values.location.slug}/{values.slug}")).toBe(
            "https://site.com/preview"
        );
    });

    it("should find ref fields the pattern reads through", () => {
        expect(
            getPatternRefFieldIds("/{values.location.slug}/{values.slug}/{values.tags}", fields)
        ).toEqual(["location"]);
        expect(getPatternRefFieldIds("/articles/{values.slug}", fields)).toEqual([]);
    });

    it("should collect ref values from single and multiple-value fields", () => {
        const tag = { id: "tag1#0001", modelId: "tag" };
        expect(
            getRefValues({ location, tags: [tag, null], slug: "x" }, ["location", "tags"])
        ).toEqual([location, tag]);
        expect(getRefValues({ location: null }, ["location"])).toEqual([]);
    });

    it("should resolve a ref field value once the referenced entry is loaded", () => {
        const entry = { id: "page1#0001", values: { slug: "climbing", location } };
        const pattern = "/{values.location.slug}/{values.slug}";

        const notLoaded = withRefValues(entry, ["location"], {});
        expect(buildDisplayUrl("https://site.com", pattern, notLoaded)).toBe(
            "https://site.com/new/climbing"
        );

        const loaded = withRefValues(entry, ["location"], {
            [location.id]: { slug: "baker", id: "should-not-win" }
        });
        expect(buildDisplayUrl("https://site.com", pattern, loaded)).toBe(
            "https://site.com/baker/climbing"
        );
        expect((loaded.values as any).location.id).toBe(location.id);
    });

    it("should support indexing into multiple-value ref fields", () => {
        const tag = { id: "tag1#0001", modelId: "tag" };
        const entry = { values: { tags: [tag] } };
        const resolved = withRefValues(entry, ["tags"], { [tag.id]: { slug: "news" } });
        expect(resolveSlugPattern("/{values.tags.0.slug}", resolved)).toBe("/news");
    });

    it("should leave the entry untouched when there are no ref fields to fill in", () => {
        const entry = { values: { slug: "x", location } };
        expect(withRefValues(entry, [], { [location.id]: { slug: "baker" } })).toBe(entry);
    });
});
