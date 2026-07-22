import { describe, expect, it } from "vitest";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { walkModelLocator } from "~/features/cms/CmsLocatorResolver/modelLocator.js";
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
