import { describe, it, expect } from "vitest";
import { toFormErrors } from "./toFormErrors.js";
import { CmsEntryError } from "~/features/contentEntry/CmsEntryError.js";

const field = (fieldId: string, type: string, extra: Record<string, unknown> = {}) => ({
    id: fieldId,
    fieldId,
    type,
    label: fieldId,
    ...extra
});

const model = {
    modelId: "page",
    fields: [
        field("sku", "text"),
        field("variants", "object", {
            list: true,
            settings: { fields: [field("code", "text")] }
        }),
        field("blocks", "dynamicZone", {
            list: true,
            settings: {
                templates: [
                    {
                        id: "hero",
                        gqlTypeName: "PageHero",
                        fields: [
                            field("title", "text"),
                            field("links", "object", {
                                list: true,
                                settings: { fields: [field("url", "text")] }
                            })
                        ]
                    }
                ]
            }
        }),
        field("single", "dynamicZone", {
            settings: {
                templates: [
                    { id: "plain", gqlTypeName: "PagePlain", fields: [field("ctrl", "text")] }
                ]
            }
        })
    ]
} as any;

const validationError = (data: unknown[]) =>
    new CmsEntryError(
        { message: "Validation failed.", code: "Cms/Entry/ValidationError", data: data as any },
        "Could not update entry"
    );

describe("toFormErrors", () => {
    it("maps a top-level field error to its field", () => {
        const error = validationError([
            { id: "sku", fieldId: "sku", error: "Value must be unique.", parents: [] }
        ]);

        expect(toFormErrors(error, model)).toEqual([
            { path: "sku", message: "Value must be unique." }
        ]);
    });

    it("keeps list item indexes in the path", () => {
        const error = validationError([
            { fieldId: "code", error: "Required.", parents: ["variants", "1"] }
        ]);

        expect(toFormErrors(error, model)).toEqual([
            { path: "variants.1.code", message: "Required." }
        ]);
    });

    it("drops dynamic zone template names from the path", () => {
        const error = validationError([
            { fieldId: "title", error: "Required.", parents: ["blocks", "0", "PageHero"] },
            {
                fieldId: "url",
                error: "Invalid URL.",
                parents: ["blocks", "2", "PageHero", "links", "1"]
            },
            { fieldId: "ctrl", error: "Required.", parents: ["single", "PagePlain"] }
        ]);

        expect(toFormErrors(error, model)).toEqual([
            { path: "blocks.0.title", message: "Required." },
            { path: "blocks.2.links.1.url", message: "Invalid URL." },
            { path: "single.ctrl", message: "Required." }
        ]);
    });

    it("falls back to the error message when there are no field errors", () => {
        const error = new CmsEntryError(
            { message: "Entry is locked.", code: "Cms/Entry/Locked", data: null },
            "Could not update entry"
        );

        expect(toFormErrors(error, model)).toEqual([{ path: "", message: "Entry is locked." }]);
    });

    it("uses the message of any other error", () => {
        expect(toFormErrors(new Error("Network error: Failed to fetch"), model)).toEqual([
            { path: "", message: "Network error: Failed to fetch" }
        ]);
        expect(toFormErrors("boom", model)).toEqual([
            { path: "", message: "Could not save the entry." }
        ]);
    });
});
