import { describe, expect, it } from "vitest";
import { toWbPageProperties } from "~/features/target/toWbPageProperties.js";

const current = () => ({
    title: "Home",
    path: "/home",
    language: "en",
    tags: ["a"],
    social: { title: "T" },
    seo: {
        title: "S",
        description: "D",
        metaTags: [{ name: "robots", content: "all" }],
        noIndex: false
    }
});

describe("toWbPageProperties", () => {
    it("sets the title and returns every other key unchanged (the FULL properties)", () => {
        expect(toWbPageProperties(current(), { "properties.title": "New" })).toEqual({
            ...current(),
            title: "New"
        });
    });

    it("sets SEO scalars and keeps the other SEO keys, path, language and social", () => {
        const merged = toWbPageProperties(current(), {
            "properties.seo.title": "New S",
            "properties.seo.noIndex": true,
            "properties.seo.canonicalUrl": "/new"
        });

        expect(merged).toEqual({
            ...current(),
            seo: {
                title: "New S",
                description: "D",
                metaTags: [{ name: "robots", content: "all" }],
                noIndex: true,
                canonicalUrl: "/new"
            }
        });
        expect(merged.path).toBe("/home");
        expect(merged.language).toBe("en");
    });

    it("writes the title and SEO keys together", () => {
        const merged = toWbPageProperties(current(), {
            "properties.title": "New",
            "properties.seo.description": "New D"
        });

        expect(merged).toMatchObject({ title: "New", seo: { title: "S", description: "New D" } });
    });

    it("removes an SEO key written as null and leaves the rest", () => {
        const merged = toWbPageProperties(current(), { "properties.seo.description": null });

        expect(merged.seo).toEqual({
            title: "S",
            metaTags: [{ name: "robots", content: "all" }],
            noIndex: false
        });
    });

    it("creates seo when it is missing or not an object", () => {
        expect(
            toWbPageProperties({ title: "Home", path: "/home" }, { "properties.seo.title": "S" })
        ).toEqual({ title: "Home", path: "/home", seo: { title: "S" } });
        expect(
            toWbPageProperties(
                { title: "Home", seo: "broken" },
                { "properties.seo.noFollow": true }
            )
        ).toEqual({ title: "Home", seo: { noFollow: true } });
    });

    it("does not add seo when no SEO key is written", () => {
        expect(toWbPageProperties({ title: "Home" }, { "properties.title": "New" })).toEqual({
            title: "New"
        });
    });

    it("never mutates the current properties and copies the seo object it changes", () => {
        const values = current();
        const snapshot = JSON.parse(JSON.stringify(values));

        const merged = toWbPageProperties(values, {
            "properties.title": "New",
            "properties.seo.title": "New S"
        });

        expect(values).toEqual(snapshot);
        expect((merged.seo as object) === values.seo).toBe(false);
        expect(merged === (values as object)).toBe(false);
    });

    it("does not touch the prototype, for prototype keys in the current values or the updates", () => {
        const values = JSON.parse(
            '{ "title": "Home", "__proto__": { "polluted": true }, "seo": { "__proto__": { "polluted": true } } }'
        );
        const updates = JSON.parse(
            '{ "__proto__": { "polluted": true }, "properties.seo.title": "S" }'
        );

        const merged = toWbPageProperties(values, updates);
        const seo = merged.seo as Record<string, unknown>;

        expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
        expect(Object.getPrototypeOf(seo)).toBe(Object.prototype);
        expect("polluted" in merged).toBe(false);
        expect("polluted" in seo).toBe(false);
        expect(seo.title).toBe("S");
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
});
