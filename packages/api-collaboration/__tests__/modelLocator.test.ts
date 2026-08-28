import { describe, expect, it } from "vitest";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import {
    itemStillExists,
    walkModelLocator
} from "~/features/cms/CmsLocatorResolver/modelLocator.js";
import { formatCmsContentId, parseCmsContentId } from "~/utils/cmsContentId.js";

// A minimal model exercising top-level, nested object, list, and dynamic-zone fields.
const model = {
    modelId: "article",
    fields: [
        { fieldId: "title", label: "Title", type: "text" },
        {
            fieldId: "author",
            label: "Author",
            type: "object",
            settings: {
                fields: [{ fieldId: "name", label: "Name", type: "text" }]
            }
        },
        {
            fieldId: "gallery",
            label: "Gallery",
            type: "object",
            settings: {
                fields: [{ fieldId: "caption", label: "Caption", type: "text" }]
            }
        },
        {
            fieldId: "content",
            label: "Content",
            type: "dynamicZone",
            settings: {
                templates: [
                    {
                        id: "hero",
                        fields: [{ fieldId: "heading", label: "Heading", type: "text" }]
                    }
                ]
            }
        },
        {
            fieldId: "phone",
            label: "Phone",
            type: "object",
            list: true,
            settings: {
                fields: [{ fieldId: "type", label: "Type", type: "text" }]
            }
        },
        {
            fieldId: "sections",
            label: "Sections",
            type: "object",
            list: true,
            settings: {
                fields: [
                    {
                        fieldId: "items",
                        label: "Items",
                        type: "object",
                        list: true,
                        settings: {
                            fields: [{ fieldId: "text", label: "Text", type: "text" }]
                        }
                    }
                ]
            }
        }
    ]
} as unknown as CmsModel;

describe("walkModelLocator", () => {
    it("resolves a top-level field with no breadcrumb", () => {
        expect(walkModelLocator(model, "title")).toEqual({
            exists: true,
            label: "Title",
            path: undefined
        });
    });

    it("resolves a nested object field with a breadcrumb", () => {
        expect(walkModelLocator(model, "author.name")).toEqual({
            exists: true,
            label: "Name",
            path: ["Author"]
        });
    });

    it("skips numeric list indices", () => {
        expect(walkModelLocator(model, "gallery.2.caption")).toEqual({
            exists: true,
            label: "Caption",
            path: ["Gallery"]
        });
    });

    it("descends dynamic-zone templates", () => {
        expect(walkModelLocator(model, "content.heading")).toEqual({
            exists: true,
            label: "Heading",
            path: ["Content"]
        });
    });

    it("reports a removed top-level field as non-existent", () => {
        expect(walkModelLocator(model, "subtitle")).toEqual({ exists: false });
    });

    it("reports a removed nested field as non-existent", () => {
        expect(walkModelLocator(model, "author.unknown")).toEqual({ exists: false });
    });

    it("resolves an id-anchored list-nested field, skipping the item id", () => {
        expect(walkModelLocator(model, "phone.abc123.type")).toEqual({
            exists: true,
            label: "Type",
            path: ["Phone"]
        });
    });

    it("still resolves a legacy numeric list index for a list field", () => {
        expect(walkModelLocator(model, "phone.2.type")).toEqual({
            exists: true,
            label: "Type",
            path: ["Phone"]
        });
    });

    it("resolves a comment anchored on a single list item to the list field", () => {
        expect(walkModelLocator(model, "phone.abc123")).toEqual({
            exists: true,
            label: "Phone",
            path: undefined
        });
    });

    it("interleaves an id after every list ancestor for nested lists", () => {
        expect(walkModelLocator(model, "sections.aaa111.items.bbb222.text")).toEqual({
            exists: true,
            label: "Text",
            path: ["Sections", "Items"]
        });
    });
});

describe("itemStillExists", () => {
    it("returns true when the referenced list item is present", () => {
        const values = { phone: [{ _id: "abc123", type: "mobile" }] };
        expect(itemStillExists(model, values, "phone.abc123.type")).toBe(true);
    });

    it("returns false when the referenced list item was removed", () => {
        const values = { phone: [{ _id: "kept", type: "mobile" }] };
        expect(itemStillExists(model, values, "phone.gone.type")).toBe(false);
    });

    it("returns true (undetermined) only when values could not be loaded", () => {
        expect(itemStillExists(model, undefined, "phone.abc123.type")).toBe(true);
    });

    it("returns false when the list is loaded but empty/absent (item deleted)", () => {
        // Values loaded, but the `phone` list has no array here — the referenced item is gone.
        expect(itemStillExists(model, {}, "phone.abc123.type")).toBe(false);
    });

    it("verifies items across nested lists", () => {
        const values = {
            sections: [{ _id: "aaa111", items: [{ _id: "bbb222", text: "hi" }] }]
        };
        expect(itemStillExists(model, values, "sections.aaa111.items.bbb222.text")).toBe(true);
        expect(itemStillExists(model, values, "sections.aaa111.items.zzz.text")).toBe(false);
    });

    it("resolves a legacy numeric index against the array", () => {
        const values = { phone: [{ _id: "abc123", type: "mobile" }] };
        expect(itemStillExists(model, values, "phone.0.type")).toBe(true);
        expect(itemStillExists(model, values, "phone.5.type")).toBe(false);
    });
});

describe("cmsContentId", () => {
    it("round-trips modelId and entryId", () => {
        expect(parseCmsContentId(formatCmsContentId("article", "entry-1"))).toEqual({
            modelId: "article",
            entryId: "entry-1"
        });
    });

    it("splits on the first separator only", () => {
        expect(parseCmsContentId("article:a:b")).toEqual({
            modelId: "article",
            entryId: "a:b"
        });
    });

    it("returns nulls when malformed", () => {
        expect(parseCmsContentId("noseparator")).toEqual({ modelId: null, entryId: null });
        expect(parseCmsContentId("article:")).toEqual({ modelId: null, entryId: null });
    });
});
