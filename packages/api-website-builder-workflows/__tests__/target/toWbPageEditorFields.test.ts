import { describe, expect, it } from "vitest";
import {
    toWbPageEditorFields,
    type WbPageEditorSource
} from "~/features/target/toWbPageEditorFields.js";

const createSource = (properties: Record<string, unknown>): WbPageEditorSource => {
    return {
        properties: properties as WbPageEditorSource["properties"],
        location: { folderId: "root" },
        status: "draft",
        metadata: { notes: "n" },
        bindings: { a: { inputs: {} } },
        elements: {},
        extensions: undefined
    };
};

describe("toWbPageEditorFields", () => {
    it("lists the title, the other properties, the SEO scalars, the SEO rest and the page parts, in that order", () => {
        const fields = toWbPageEditorFields(
            createSource({
                title: "Home",
                path: "/home",
                language: "en",
                seo: { title: "S", metaTags: [], noIndex: true },
                social: { title: "T" }
            })
        );

        expect(fields.map(item => [item.path, item.writable])).toEqual([
            ["properties.title", true],
            ["properties.path", false],
            ["properties.language", false],
            ["properties.social", false],
            ["properties.seo.title", true],
            ["properties.seo.description", true],
            ["properties.seo.canonicalUrl", true],
            ["properties.seo.noIndex", true],
            ["properties.seo.noFollow", true],
            ["properties.seo.metaTags", false],
            ["location", false],
            ["status", false],
            ["metadata", false],
            ["bindings", false],
            ["extensions", false],
            ["elements", false]
        ]);
    });

    it("gives labels, types and values of the writable rows, null for a missing one", () => {
        const fields = toWbPageEditorFields(
            createSource({ title: "Home", seo: { title: "S", noIndex: true } })
        );

        expect(fields.filter(item => item.writable)).toEqual([
            {
                path: "properties.title",
                label: "Page title",
                type: "text",
                value: "Home",
                writable: true
            },
            {
                path: "properties.seo.title",
                label: "SEO title",
                type: "text",
                value: "S",
                writable: true
            },
            {
                path: "properties.seo.description",
                label: "SEO description",
                type: "long-text",
                value: null,
                writable: true
            },
            {
                path: "properties.seo.canonicalUrl",
                label: "SEO canonical URL",
                type: "text",
                value: null,
                writable: true
            },
            {
                path: "properties.seo.noIndex",
                label: "SEO no index",
                type: "boolean",
                value: true,
                writable: true
            },
            {
                path: "properties.seo.noFollow",
                label: "SEO no follow",
                type: "boolean",
                value: null,
                writable: true
            }
        ]);
    });

    it("reads every other properties key as one read-only row with its whole value and type", () => {
        const fields = toWbPageEditorFields(
            createSource({
                title: "Home",
                path: "/home",
                count: 3,
                flag: true,
                tags: ["a"],
                social: { title: "T" },
                nothing: null
            })
        );
        const byPath = Object.fromEntries(fields.map(item => [item.path, item]));

        expect(byPath["properties.path"]).toMatchObject({ type: "text", value: "/home" });
        expect(byPath["properties.count"]).toMatchObject({ type: "number", value: 3 });
        expect(byPath["properties.flag"]).toMatchObject({ type: "boolean", value: true });
        expect(byPath["properties.tags"]).toMatchObject({ type: "list", value: ["a"] });
        expect(byPath["properties.social"]).toMatchObject({
            type: "object",
            value: { title: "T" }
        });
        expect(byPath["properties.nothing"]).toMatchObject({ type: "null", value: null });
    });

    it("reads the rest of the SEO group as read-only rows and a non-object seo as missing", () => {
        const withRest = toWbPageEditorFields(
            createSource({
                title: "Home",
                seo: { metaTags: [{ name: "a", content: "b" }], extra: 1 }
            })
        );
        const withString = toWbPageEditorFields(createSource({ title: "Home", seo: "broken" }));

        expect(
            withRest.filter(item => item.path.startsWith("properties.seo.") && !item.writable)
        ).toEqual([
            {
                path: "properties.seo.metaTags",
                label: "properties.seo.metaTags",
                type: "list",
                value: [{ name: "a", content: "b" }],
                writable: false
            },
            {
                path: "properties.seo.extra",
                label: "properties.seo.extra",
                type: "number",
                value: 1,
                writable: false
            }
        ]);
        expect(withString.filter(item => item.writable).map(item => item.value)).toEqual([
            "Home",
            null,
            null,
            null,
            null,
            null
        ]);
    });

    it("skips a properties key that contains a dot, so it cannot shadow an allowlisted path", () => {
        const fields = toWbPageEditorFields(
            createSource({ title: "Home", "seo.title": "shadow", seo: { title: "Real" } })
        );

        expect(fields.filter(item => item.path === "properties.seo.title")).toEqual([
            expect.objectContaining({ value: "Real", writable: true })
        ]);
    });

    it("summarises the element tree instead of listing it", () => {
        const fields = toWbPageEditorFields({
            ...createSource({ title: "Home" }),
            elements: {
                root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Box" } },
                a: { type: "Webiny/Element", id: "a", component: { name: "Webiny/Text" } },
                b: { type: "Webiny/Element", id: "b", component: { name: "Webiny/Text" } },
                c: { type: "Webiny/Element", id: "c" }
            }
        });

        expect(fields.find(item => item.path === "elements")).toEqual({
            path: "elements",
            label: "elements",
            type: "object",
            value: { count: 4, components: { "Webiny/Box": 1, "Webiny/Text": 2, "(none)": 1 } },
            writable: false
        });
    });

    it("gives location, status, metadata and bindings whole and an absent extensions as null", () => {
        const fields = toWbPageEditorFields(createSource({ title: "Home" }));
        const byPath = Object.fromEntries(fields.map(item => [item.path, item]));

        expect(byPath.location.value).toEqual({ folderId: "root" });
        expect(byPath.status.value).toBe("draft");
        expect(byPath.metadata.value).toEqual({ notes: "n" });
        expect(byPath.bindings.value).toEqual({ a: { inputs: {} } });
        expect(byPath.extensions.value).toBeNull();
    });
});
