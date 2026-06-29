import { useHandler } from "~tests/testHelpers/useHandler";
import models, { createModelPlugins } from "~tests/contentAPI/mocks/contentModels";
import { CmsModelToJsonSchemaConverter } from "~/utils";
import type { CmsContext, CmsModelField } from "~/types";
import { pageModel } from "~tests/contentAPI/mocks/pageWithDynamicZonesModel";
import type { CmsModelToAstConverter } from "~/utils/contentModelAst";
import type { CmsModelInput } from "~/plugins";
import { createModelPlugin } from "~/plugins";
import type { JsonSchema } from "~/utils/contentModelToJsonSchema";
import { beforeEach, describe, expect, it } from "vitest";

describe("CmsModelToJsonSchemaConverter", () => {
    const { handler } = useHandler({
        plugins: [
            ...createModelPlugins(models.map(model => model.modelId)),
            createModelPlugin(pageModel as unknown as CmsModelInput)
        ]
    });

    let context: CmsContext;
    let astConverter: CmsModelToAstConverter;

    beforeEach(async () => {
        context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-tenant": "root"
            }
        });
        astConverter = context.cms.getModelToAstConverter();
    });

    describe("simple field types", () => {
        it("should convert text fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [createField({ fieldId: "title", type: "text", label: "Title" })]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["title"]).toEqual({
                type: "string",
                description: "Title"
            });
        });

        it("should convert long-text fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [createField({ fieldId: "body", type: "long-text", label: "Body" })]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["body"]).toEqual({
                type: "string",
                description: "Body"
            });
        });

        it("should convert rich-text fields as tool envelope", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [createField({ fieldId: "content", type: "rich-text", label: "Content" })]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });
            const richTextSchema = schema.properties!["content"];

            expect(richTextSchema.type).toBe("object");
            expect(richTextSchema.properties!["tool"]).toEqual({ const: "textToLexical" });
            expect(richTextSchema.properties!["params"].properties!["text"].type).toBe("string");
            expect(richTextSchema.required).toEqual(["tool", "params"]);
        });

        it("should convert number fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [createField({ fieldId: "price", type: "number", label: "Price" })]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["price"]).toEqual({
                type: "number",
                description: "Price"
            });
        });

        it("should convert boolean fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [createField({ fieldId: "inStock", type: "boolean", label: "In Stock" })]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["inStock"]).toEqual({
                type: "boolean",
                description: "In Stock"
            });
        });

        it("should convert file fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [createField({ fieldId: "image", type: "file", label: "Image" })]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["image"].type).toBe("string");
            expect(schema.properties!["image"].description).toContain("File identifier");
        });

        it("should convert file fields with imagesOnly", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "photo",
                        type: "file",
                        label: "Photo",
                        settings: { imagesOnly: true }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["photo"].description).toContain("Image file");
        });
    });

    describe("datetime field subtypes", () => {
        it("should convert date-only fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "birthday",
                        type: "datetime",
                        label: "Birthday",
                        settings: { type: "date" }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["birthday"].format).toBe("date");
        });

        it("should convert time-only fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "alarm",
                        type: "datetime",
                        label: "Alarm",
                        settings: { type: "time" }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["alarm"].format).toBe("time");
        });

        it("should convert dateTimeWithTimezone fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "event",
                        type: "datetime",
                        label: "Event",
                        settings: { type: "dateTimeWithTimezone" }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["event"].format).toBe("date-time");
        });

        it("should convert dateTimeWithoutTimezone fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "local",
                        type: "datetime",
                        label: "Local Time",
                        settings: { type: "dateTimeWithoutTimezone" }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["local"].format).toBe("date-time");
        });
    });

    describe("ref fields", () => {
        it("should convert ref fields with model constraint", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "category",
                        type: "ref",
                        label: "Category",
                        settings: { models: [{ modelId: "category" }] }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });
            const refSchema = schema.properties!["category"];

            expect(refSchema.type).toBe("object");
            expect(refSchema.properties!["entryId"].type).toBe("string");
            expect(refSchema.properties!["modelId"].type).toBe("string");
            expect(refSchema.properties!["modelId"].enum).toEqual(["category"]);
            expect(refSchema.required).toEqual(["entryId", "modelId"]);
        });

        it("should convert ref fields with multiple models", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "related",
                        type: "ref",
                        label: "Related",
                        settings: {
                            models: [{ modelId: "product" }, { modelId: "category" }]
                        }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["related"].properties!["modelId"].enum).toEqual([
                "product",
                "category"
            ]);
        });
    });

    describe("list fields", () => {
        it("should wrap list fields in an array schema", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "tags",
                        type: "text",
                        label: "Tags",
                        list: true
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });
            const tagsSchema = schema.properties!["tags"];

            expect(tagsSchema.type).toBe("array");
            expect(tagsSchema.items!.type).toBe("string");
        });

        it("should wrap ref list fields in an array schema", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "categories",
                        type: "ref",
                        label: "Categories",
                        list: true,
                        settings: { models: [{ modelId: "category" }] }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });
            const refListSchema = schema.properties!["categories"];

            expect(refListSchema.type).toBe("array");
            expect(refListSchema.items!.type).toBe("object");
            expect(refListSchema.items!.properties!["entryId"].type).toBe("string");
        });
    });

    describe("predefined values", () => {
        it("should add enum for text fields with predefined values", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "color",
                        type: "text",
                        label: "Color",
                        predefinedValues: {
                            enabled: true,
                            values: [
                                { label: "Red", value: "red" },
                                { label: "Green", value: "green" },
                                { label: "Blue", value: "blue" }
                            ]
                        }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["color"].enum).toEqual(["red", "green", "blue"]);
        });

        it("should parse enum values as numbers for number fields", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "priority",
                        type: "number",
                        label: "Priority",
                        predefinedValues: {
                            enabled: true,
                            values: [
                                { label: "Low", value: "1" },
                                { label: "High", value: "10" }
                            ]
                        }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["priority"].enum).toEqual([1, 10]);
        });

        it("should not add enum when predefinedValues is disabled", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "name",
                        type: "text",
                        label: "Name",
                        predefinedValues: {
                            enabled: false,
                            values: [{ label: "A", value: "a" }]
                        }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["name"].enum).toBeUndefined();
        });
    });

    describe("validation constraints", () => {
        it("should apply required validation", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "title",
                        type: "text",
                        label: "Title",
                        validation: [{ name: "required", message: "Required" }]
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.required).toContain("title");
        });

        it("should apply minLength and maxLength", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "name",
                        type: "text",
                        label: "Name",
                        validation: [
                            {
                                name: "minLength",
                                message: "Too short",
                                settings: { value: "3" }
                            },
                            {
                                name: "maxLength",
                                message: "Too long",
                                settings: { value: "100" }
                            }
                        ]
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["name"].minLength).toBe(3);
            expect(schema.properties!["name"].maxLength).toBe(100);
        });

        it("should apply gte and lte as minimum and maximum", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "price",
                        type: "number",
                        label: "Price",
                        validation: [
                            { name: "gte", message: "Min", settings: { value: "0" } },
                            { name: "lte", message: "Max", settings: { value: "1000" } }
                        ]
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["price"].minimum).toBe(0);
            expect(schema.properties!["price"].maximum).toBe(1000);
        });

        it("should apply pattern preset as format", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "email",
                        type: "text",
                        label: "Email",
                        validation: [
                            {
                                name: "pattern",
                                message: "Invalid",
                                settings: { preset: "email" }
                            }
                        ]
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["email"].format).toBe("email");
        });
    });

    describe("hidden fields", () => {
        it("should exclude hidden fields by default", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({ fieldId: "title", type: "text", label: "Title" }),
                    createField({
                        fieldId: "meta",
                        type: "text",
                        label: "Meta",
                        renderer: { name: "hidden" }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["title"]).toBeDefined();
            expect(schema.properties!["meta"]).toBeUndefined();
        });

        it("should include hidden fields when opted in", () => {
            const converter = new CmsModelToJsonSchemaConverter({
                includeHiddenFields: true
            });
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "meta",
                        type: "text",
                        label: "Meta",
                        renderer: { name: "hidden" }
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["meta"]).toBeDefined();
        });
    });

    describe("descriptions", () => {
        it("should build description from label, description, and help", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({
                fields: [
                    createField({
                        fieldId: "title",
                        type: "text",
                        label: "Title",
                        description: "The main title",
                        help: "Keep it short"
                    })
                ]
            });

            const schema = converter.convert(ast, { name: "Test", description: null });

            expect(schema.properties!["title"].description).toBe(
                "Title. The main title. Keep it short"
            );
        });

        it("should set model description from name and description", () => {
            const converter = new CmsModelToJsonSchemaConverter();
            const ast = astConverter.toAst({ fields: [] });

            const schema = converter.convert(ast, {
                name: "Blog Post",
                description: "A blog post entry"
            });

            expect(schema.description).toBe("Blog Post. A blog post entry");
        });
    });

    describe("object fields (via real model)", () => {
        it("should convert nested object fields from product model", async () => {
            const model = await context.cms.getModel("product");
            const ast = astConverter.toAst(model);
            const converter = new CmsModelToJsonSchemaConverter();

            const schema = converter.convert(ast, {
                name: model.name,
                description: model.description
            });

            const variant = schema.properties!["variant"];
            expect(variant.type).toBe("object");
            expect(variant.properties!["name"].type).toBe("string");
            expect(variant.properties!["price"].type).toBe("number");
            expect(variant.properties!["images"].type).toBe("array");
            expect(variant.properties!["images"].items!.type).toBe("string");

            const options = variant.properties!["options"];
            expect(options.type).toBe("array");
            expect(options.items!.type).toBe("object");
            expect(options.items!.properties!["name"].type).toBe("string");
            expect(options.items!.properties!["price"].type).toBe("number");
        });
    });

    describe("dynamic zone fields (via real model)", () => {
        it("should convert dynamic zone from page model", async () => {
            const model = await context.cms.getModel(pageModel.modelId);
            const ast = astConverter.toAst(model);
            const converter = new CmsModelToJsonSchemaConverter();

            const schema = converter.convert(ast, {
                name: model.name,
                description: model.description
            });

            const header = schema.properties!["header"];
            expect(header).toBeDefined();
            expect(header.oneOf).toBeDefined();
            expect(header.oneOf!.length).toBeGreaterThan(0);
            expect(header.discriminator).toEqual({ propertyName: "_templateId" });

            const firstTemplate = header.oneOf![0];
            expect(firstTemplate.type).toBe("object");
            expect(firstTemplate.properties!["_templateId"]).toBeDefined();
            expect(firstTemplate.properties!["_templateId"].const).toBeDefined();
            expect(firstTemplate.required).toContain("_templateId");
        });

        it("should convert list dynamic zone fields as arrays", async () => {
            const model = await context.cms.getModel(pageModel.modelId);
            const ast = astConverter.toAst(model);
            const converter = new CmsModelToJsonSchemaConverter();

            const schema = converter.convert(ast, {
                name: model.name,
                description: model.description
            });

            const content = schema.properties!["content"];
            expect(content.type).toBe("array");
            expect(content.items!.oneOf).toBeDefined();
        });
    });

    describe("full model conversion", () => {
        it("should produce valid JSON Schema for the product model", async () => {
            const model = await context.cms.getModel("product");
            const ast = astConverter.toAst(model);
            const converter = new CmsModelToJsonSchemaConverter();

            const schema = converter.convert(ast, {
                name: model.name,
                description: model.description
            });

            expect(schema.type).toBe("object");
            expect(schema.properties).toBeDefined();

            const fieldIds = Object.keys(schema.properties!);
            expect(fieldIds).toContain("title");
            expect(fieldIds).toContain("category");
            expect(fieldIds).toContain("price");
            expect(fieldIds).toContain("inStock");
            expect(fieldIds).toContain("variant");

            assertValidJsonSchema(schema);
        });

        it("should produce valid JSON Schema for page model with dynamic zones", async () => {
            const model = await context.cms.getModel(pageModel.modelId);
            const ast = astConverter.toAst(model);
            const converter = new CmsModelToJsonSchemaConverter();

            const schema = converter.convert(ast, {
                name: model.name,
                description: model.description
            });

            expect(schema.type).toBe("object");
            expect(schema.properties).toBeDefined();

            assertValidJsonSchema(schema);
        });
    });
});

function createField(params: {
    fieldId: string;
    type: string;
    label: string;
    list?: boolean;
    description?: string;
    help?: string;
    settings?: Record<string, any>;
    predefinedValues?: CmsModelField["predefinedValues"];
    validation?: CmsModelField["validation"];
    listValidation?: CmsModelField["listValidation"];
    renderer?: { name: string; settings?: Record<string, any> | null };
}): CmsModelField {
    return {
        id: params.fieldId,
        fieldId: params.fieldId,
        storageId: `${params.type}@${params.fieldId}`,
        type: params.type,
        label: params.label,
        list: params.list,
        description: params.description,
        help: params.help,
        settings: params.settings || {},
        predefinedValues: params.predefinedValues || { enabled: false, values: [] },
        validation: params.validation || [],
        listValidation: params.listValidation || [],
        renderer: params.renderer || null,
        tags: []
    };
}

function assertValidJsonSchema(schema: JsonSchema): void {
    if (schema.type === "object" && schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
            expect(prop, `Property "${key}" should be defined`).toBeDefined();
            assertValidJsonSchema(prop);
        }

        if (schema.required) {
            for (const req of schema.required) {
                expect(
                    schema.properties[req],
                    `Required field "${req}" should exist in properties`
                ).toBeDefined();
            }
        }
    }

    if (schema.type === "array" && schema.items) {
        assertValidJsonSchema(schema.items);
    }

    if (schema.oneOf) {
        for (const variant of schema.oneOf) {
            assertValidJsonSchema(variant);
        }
    }
}
