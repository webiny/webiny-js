import { describe, expect, it } from "vitest";
import type {
    CmsDynamicZoneTemplate,
    CmsModelField
} from "@webiny/api-headless-cms/types/index.js";
import { modelToFieldDescriptors, toFieldDescriptors } from "~/cms/model/toFieldDescriptors.js";
import { diffValues } from "~/core/diff/diffValues.js";
import { summarise } from "./descriptorHelpers.js";

const field = (overrides: Partial<CmsModelField> & { fieldId: string }): CmsModelField =>
    ({
        id: overrides.fieldId,
        type: "text",
        storageId: `text@${overrides.fieldId}`,
        label: overrides.fieldId,
        validation: [],
        listValidation: [],
        ...overrides
    }) as CmsModelField;

/**
 * A dynamic-zone template. Only `id`, `name` and `fields` matter here; the rest of the type is
 * GraphQL and admin-layout metadata that neither the differ nor the AST converter reads.
 */
const template = (
    overrides: Partial<CmsDynamicZoneTemplate> & { id: string; name: string }
): CmsDynamicZoneTemplate => ({
    gqlTypeName: overrides.name,
    description: "",
    fields: [],
    layout: [],
    validation: [],
    ...overrides
});

describe("toFieldDescriptors", () => {
    it("projects a scalar field", () => {
        expect(toFieldDescriptors([field({ fieldId: "title", label: "Headline" })])).toEqual([
            { fieldId: "title", label: "Headline", kind: "scalar", list: false }
        ]);
    });

    it("carries the list flag", () => {
        const [descriptor] = toFieldDescriptors([field({ fieldId: "tags", list: true })]);

        expect(descriptor!.list).toBe(true);
    });

    it("falls back to the field id when a label is missing", () => {
        const [descriptor] = toFieldDescriptors([field({ fieldId: "title", label: "" })]);

        expect(descriptor!.label).toBe("title");
    });

    it("projects an object field's children", () => {
        const [descriptor] = toFieldDescriptors([
            field({
                fieldId: "author",
                type: "object",
                settings: { fields: [field({ fieldId: "name" })] }
            })
        ]);

        expect(descriptor!.kind).toBe("object");
        expect(descriptor!.fields).toEqual([
            { fieldId: "name", label: "name", kind: "scalar", list: false }
        ]);
    });

    it("projects nested object fields to full depth", () => {
        const [descriptor] = toFieldDescriptors([
            field({
                fieldId: "a",
                type: "object",
                settings: {
                    fields: [
                        field({
                            fieldId: "b",
                            type: "object",
                            settings: { fields: [field({ fieldId: "c" })] }
                        })
                    ]
                }
            })
        ]);

        expect(descriptor!.fields![0]!.fields![0]!.fieldId).toBe("c");
    });

    it("projects dynamic zone templates, labelled by name", () => {
        const [descriptor] = toFieldDescriptors([
            field({
                fieldId: "blocks",
                type: "dynamicZone",
                list: true,
                settings: {
                    templates: [
                        template({
                            id: "hero",
                            name: "Hero",
                            fields: [field({ fieldId: "headline" })]
                        })
                    ]
                }
            })
        ]);

        expect(descriptor!.kind).toBe("dynamicZone");
        expect(descriptor!.templates).toEqual([
            {
                id: "hero",
                label: "Hero",
                fields: [{ fieldId: "headline", label: "headline", kind: "scalar", list: false }]
            }
        ]);
    });

    it("excludes layout-only fields, which hold no value", () => {
        const descriptors = toFieldDescriptors([
            field({ fieldId: "title" }),
            field({ fieldId: "sep", type: "uiSeparator" }),
            field({ fieldId: "note", type: "uiAlert" }),
            field({ fieldId: "tabs", type: "uiTabs" })
        ]);

        expect(descriptors.map(descriptor => descriptor.fieldId)).toEqual(["title"]);
    });

    it("survives an object field with no children declared", () => {
        const [descriptor] = toFieldDescriptors([field({ fieldId: "empty", type: "object" })]);

        expect(descriptor!.fields).toEqual([]);
    });

    it("survives a dynamic zone with no templates declared", () => {
        const [descriptor] = toFieldDescriptors([
            field({ fieldId: "blocks", type: "dynamicZone" })
        ]);

        expect(descriptor!.templates).toBeUndefined();
    });

    it("accepts a model with no fields", () => {
        expect(modelToFieldDescriptors({ fields: [] })).toEqual([]);
    });
});

describe("toFieldDescriptors, end to end through the differ", () => {
    it("diffs a real model shape by fieldId", () => {
        const descriptors = modelToFieldDescriptors({
            fields: [
                field({ fieldId: "title" }),
                field({
                    fieldId: "sections",
                    type: "object",
                    list: true,
                    settings: { fields: [field({ fieldId: "heading" })] }
                })
            ]
        });

        const result = diffValues(
            descriptors,
            { title: "old", sections: [{ _id: "aaa", heading: "keep" }] },
            { title: "new", sections: [{ _id: "aaa", heading: "keep" }] }
        );

        expect(summarise(result.changeset)).toEqual(["title"]);
    });

    it("diffs into a dynamic zone template resolved from the model", () => {
        const descriptors = modelToFieldDescriptors({
            fields: [
                field({
                    fieldId: "blocks",
                    type: "dynamicZone",
                    list: true,
                    settings: {
                        templates: [
                            template({
                                id: "hero",
                                name: "Hero",
                                fields: [field({ fieldId: "headline" })]
                            })
                        ]
                    }
                })
            ]
        });

        const result = diffValues(
            descriptors,
            { blocks: [{ _id: "aaa", _templateId: "hero", headline: "one" }] },
            { blocks: [{ _id: "aaa", _templateId: "hero", headline: "two" }] }
        );

        expect(summarise(result.changeset)).toEqual(["blocks#aaa.headline"]);
    });
});
