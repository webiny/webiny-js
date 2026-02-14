import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import { ModelFactory, ModelsProvider } from "~/features/modelBuilder/index.js";

describe("All Field Types Model", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("should support all field types with various configurations", async () => {
        class AllFieldsModelImpl implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .private({
                            modelId: "allFieldsModel",
                            name: "All Fields Model"
                        })
                        .fields(fields => ({
                            // Text field - basic
                            title: fields.text().label("Title").required("Title is required."),

                            // Long text field
                            description: fields.longText().label("Description"),

                            // Rich text field
                            content: fields.richText().label("Content"),

                            // Number field
                            count: fields.number().label("Count"),

                            // Number field with validation
                            rating: fields
                                .number()
                                .label("Rating")
                                .gte(1, "Must be at least 1")
                                .lte(5, "Must be at most 5"),

                            // Boolean field with default
                            isPublished: fields.boolean().label("Is Published").defaultValue(false),

                            // File field - basic
                            attachment: fields.file().label("Attachment"),

                            // File field - images only
                            coverImage: fields.file().label("Cover Image").imagesOnly(),

                            // File field - multiple
                            gallery: fields.file().label("Gallery").imagesOnly().list(),

                            // DateTime field - date only
                            publishDate: fields.datetime().label("Publish Date").dateOnly(),

                            // DateTime field - time only
                            publishTime: fields.datetime().label("Publish Time").timeOnly(),

                            // DateTime field - with timezone
                            scheduledAt: fields.datetime().label("Scheduled At").withTimezone(),

                            // DateTime field - without timezone
                            createdAt: fields.datetime().label("Created At").withoutTimezone(),

                            // Reference field
                            author: fields
                                .ref()
                                .label("Author")
                                .models([{ modelId: "author" }]),

                            // Reference field - multiple
                            tags: fields
                                .ref()
                                .label("Tags")
                                .list()
                                .models([{ modelId: "tag" }]),

                            // Object field
                            metadata: fields
                                .object()
                                .label("Metadata")
                                .fields(objFields => ({
                                    source: objFields.text().label("Source"),
                                    publishedAt: objFields
                                        .datetime()
                                        .label("Published At")
                                        .withTimezone()
                                }))
                                .layout([["source"], ["publishedAt"]]),

                            // Object field - multiple (repeatable)
                            sections: fields
                                .object()
                                .label("Sections")
                                .list()
                                .fields(objFields => ({
                                    title: objFields.text().label("Section Title"),
                                    content: objFields.richText().label("Section Content"),
                                    order: objFields.number().label("Order")
                                }))
                                .layout([["title"], ["content"], ["order"]]),

                            // Dynamic Zone field
                            dynamicContent: fields
                                .dynamicZone()
                                .label("Dynamic Content")
                                .list()
                                .template("textBlock", {
                                    name: "Text Block",
                                    gqlTypeName: "TextBlock",
                                    icon: {
                                        type: "icon",
                                        name: "fas/paragraph"
                                    },
                                    description: "A simple text block",
                                    fields: f => ({
                                        heading: f.text().label("Heading"),
                                        body: f.longText().label("Body")
                                    }),
                                    layout: [["heading"], ["body"]]
                                })
                                .template("imageBlock", {
                                    name: "Image Block",
                                    gqlTypeName: "ImageBlock",
                                    icon: {
                                        type: "icon",
                                        name: "fas/image"
                                    },
                                    description: "An image with caption",
                                    fields: f => ({
                                        image: f.file().label("Image").imagesOnly(),
                                        caption: f.text().label("Caption"),
                                        altText: f.text().label("Alt Text")
                                    }),
                                    layout: [["image"], ["caption"], ["altText"]]
                                })
                                .template("statsBlock", {
                                    name: "Stats Block",
                                    gqlTypeName: "StatsBlock",
                                    icon: {
                                        type: "icon",
                                        name: "fas/chart-bar"
                                    },
                                    description: "Display statistics",
                                    fields: f => ({
                                        stats: f
                                            .object()
                                            .label("Stats")
                                            .list()
                                            .fields(statFields => ({
                                                label: statFields.text().label("Label"),
                                                value: statFields.number().label("Value"),
                                                trend: statFields
                                                    .text()
                                                    .label("Trend")
                                                    .predefinedValues([
                                                        {
                                                            value: "up",
                                                            label: "Up",
                                                            selected: false
                                                        },
                                                        {
                                                            value: "down",
                                                            label: "Down",
                                                            selected: false
                                                        },
                                                        {
                                                            value: "neutral",
                                                            label: "Neutral",
                                                            selected: true
                                                        }
                                                    ])
                                            }))
                                            .layout([["label"], ["value"], ["trend"]])
                                    }),
                                    layout: [["stats"]]
                                })
                        }))
                ];
            }
        }

        // Register the model
        container.registerInstance(ModelFactory, new AllFieldsModelImpl());

        // Get the model via provider
        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
        const model = models.find(m => m.modelId === "allFieldsModel");

        // Verify model was created
        expect(model).toBeDefined();
        expect(model!.modelId).toBe("allFieldsModel");
        expect(model!.name).toBe("All Fields Model");

        // Verify all field types are present
        const fieldTypes = model!.fields.map(f => f.type);
        expect(fieldTypes).toContain("text");
        expect(fieldTypes).toContain("long-text");
        expect(fieldTypes).toContain("rich-text");
        expect(fieldTypes).toContain("number");
        expect(fieldTypes).toContain("boolean");
        expect(fieldTypes).toContain("file");
        expect(fieldTypes).toContain("datetime");
        expect(fieldTypes).toContain("ref");
        expect(fieldTypes).toContain("object");
        expect(fieldTypes).toContain("dynamicZone");

        // Verify specific fields
        // const locationField = model!.fields.find(f => f.fieldId === "location");
        // expect(locationField?.type).toBe("object");

        const titleField = model!.fields.find(f => f.fieldId === "title");
        expect(titleField?.type).toBe("text");
        expect(titleField?.validation).toHaveLength(1);
        expect(titleField?.validation[0].name).toBe("required");

        const ratingField = model!.fields.find(f => f.fieldId === "rating");
        expect(ratingField?.type).toBe("number");
        expect(ratingField?.validation).toHaveLength(2);

        const isPublishedField = model!.fields.find(f => f.fieldId === "isPublished");
        expect(isPublishedField?.type).toBe("boolean");
        expect(isPublishedField?.settings?.defaultValue).toBe(false);

        const coverImageField = model!.fields.find(f => f.fieldId === "coverImage");
        expect(coverImageField?.type).toBe("file");
        expect(coverImageField?.settings?.imagesOnly).toBe(true);

        const publishDateField = model!.fields.find(f => f.fieldId === "publishDate");
        expect(publishDateField?.type).toBe("datetime");
        expect(publishDateField?.settings?.type).toBe("date");

        const scheduledAtField = model!.fields.find(f => f.fieldId === "scheduledAt");
        expect(scheduledAtField?.type).toBe("datetime");
        expect(scheduledAtField?.settings?.type).toBe("dateTimeWithTimezone");

        const metadataField = model!.fields.find(f => f.fieldId === "metadata");
        expect(metadataField?.type).toBe("object");
        expect(metadataField?.settings?.fields).toBeDefined();
        expect(metadataField?.settings?.fields?.length).toBe(2);
        expect(metadataField?.settings?.layout).toEqual([["source"], ["publishedAt"]]);

        const sectionsField = model!.fields.find(f => f.fieldId === "sections");
        expect(sectionsField?.type).toBe("object");
        expect(sectionsField?.list).toBe(true);
        expect(sectionsField?.settings?.fields?.length).toBe(3);
        expect(sectionsField?.settings?.layout).toEqual([["title"], ["content"], ["order"]]);

        const dynamicContentField = model!.fields.find(f => f.fieldId === "dynamicContent");
        expect(dynamicContentField?.type).toBe("dynamicZone");
        expect(dynamicContentField?.list).toBe(true);
        expect(dynamicContentField?.settings?.templates).toHaveLength(3);
        expect(dynamicContentField?.settings?.templates![0].gqlTypeName).toBe("TextBlock");
        expect(dynamicContentField?.settings?.templates![0].layout).toEqual([
            ["heading"],
            ["body"]
        ]);
        expect(dynamicContentField?.settings?.templates![1].gqlTypeName).toBe("ImageBlock");
        expect(dynamicContentField?.settings?.templates![1].layout).toEqual([
            ["image"],
            ["caption"],
            ["altText"]
        ]);
        expect(dynamicContentField?.settings?.templates![2].gqlTypeName).toBe("StatsBlock");
        expect(dynamicContentField?.settings?.templates![2].layout).toEqual([["stats"]]);

        // Verify nested object in dynamic zone template has stats with predefined values
        const statsTemplate = dynamicContentField!.settings!.templates![2]!;
        expect(statsTemplate?.fields).toHaveLength(1);
        const statsField = statsTemplate.fields[0]!;
        expect(statsField.fieldId).toBe("stats");
        expect(statsField.type).toBe("object");
        expect(statsField.list).toBe(true);
        expect(statsField.settings!.layout).toEqual([["label"], ["value"], ["trend"]]);
        expect(statsField.settings!.fields).toHaveLength(3);
        const trendField = statsField.settings!.fields!.find((f: any) => f.fieldId === "trend");
        expect(trendField!.predefinedValues!.enabled).toBe(true);
        expect(trendField!.predefinedValues!.values).toHaveLength(3);
    });

    it("should support all public-model-specific methods", async () => {
        class FullPublicModelImpl implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .public({
                            modelId: "fullPublicModel",
                            name: "Full Public Model",
                            singularApiName: "FullPublicModel",
                            pluralApiName: "FullPublicModels",
                            group: "test"
                        })
                        .icon("fas/database")
                        .description("A complete public model with all fields")
                        .titleFieldId("title")
                        .descriptionFieldId("description")
                        .imageFieldId("image")
                        .tags(["type:content", "category:article"])
                        .fields(fields => ({
                            title: fields.text().label("Title").required("Title is required."),
                            description: fields.longText().label("Description"),
                            image: fields.file().label("Image").imagesOnly(),
                            publishedAt: fields.datetime().label("Published At").withTimezone()
                        }))
                        .layout([["title"], ["description", "image"], ["publishedAt"]])
                ];
            }
        }

        container.registerInstance(ModelFactory, new FullPublicModelImpl());
        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
        const model = models.find(m => m.modelId === "fullPublicModel");

        expect(model).toBeDefined();

        // Verify basic properties
        expect(model!.modelId).toBe("fullPublicModel");
        expect(model!.name).toBe("Full Public Model");

        // Verify public-model-specific API names
        expect(model!.singularApiName).toBe("FullPublicModel");
        expect(model!.pluralApiName).toBe("FullPublicModels");

        // Verify group
        expect(model!.group).toEqual("test");

        // Verify icon
        expect(model!.icon).toStrictEqual({
            type: "icon",
            name: "fas/database"
        });

        // Verify description
        expect(model!.description).toBe("A complete public model with all fields");

        // Verify field references
        expect(model!.titleFieldId).toBe("title");
        expect(model!.descriptionFieldId).toBe("description");
        expect(model!.imageFieldId).toBe("image");

        // Verify tags - "type:model" is always included along with user tags
        expect(model!.tags).toContain("type:model");
        expect(model!.tags).toContain("type:content");
        expect(model!.tags).toContain("category:article");
        expect(model!.tags).toHaveLength(3);

        // Verify layout
        expect(model!.layout).toEqual([["title"], ["description", "image"], ["publishedAt"]]);

        // Verify fields
        expect(model!.fields).toHaveLength(4);
        const fieldIds = model!.fields.map(f => f.fieldId);
        expect(fieldIds).toEqual(["title", "description", "image", "publishedAt"]);
    });

    it("should ensure tags are unique and always include type:model", async () => {
        // Test public model with duplicate tags including "type:model"
        class DuplicateTagsPublicModel implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .public({
                            name: "Duplicate Tags Public",
                            modelId: "duplicateTagsPublic",
                            group: "test"
                        })
                        .tags(["type:model", "custom:tag", "type:model", "custom:tag"])
                        .fields(fields => ({
                            title: fields.text().label("Title")
                        }))
                        .layout([["title"]])
                ];
            }
        }

        container.registerInstance(ModelFactory, new DuplicateTagsPublicModel());
        const modelsProvider = container.resolve(ModelsProvider);
        const publicModels = await modelsProvider.list("root");
        const publicModel = publicModels.find(m => m.modelId === "duplicateTagsPublic");

        // Should have unique tags only
        expect(publicModel!.tags).toEqual(["type:model", "custom:tag"]);
        expect(publicModel!.tags).toHaveLength(2);

        // Test private model with duplicate tags
        class DuplicateTagsPrivateModel implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .private({
                            modelId: "duplicateTagsPrivate",
                            name: "Duplicate Tags Private"
                        })
                        .tags(["type:model", "custom:tag", "type:model", "custom:tag"])
                        .fields(fields => ({
                            title: fields.text().label("Title")
                        }))
                ];
            }
        }

        const container2 = new Container();
        ModelBuilderFeature.register(container2);
        container2.registerInstance(ModelFactory, new DuplicateTagsPrivateModel());
        const privateProvider = container2.resolve(ModelsProvider);
        const privateModels = await privateProvider.list("root");
        const privateModel = privateModels.find(m => m.modelId === "duplicateTagsPrivate");

        // Should have unique tags only
        expect(privateModel!.tags).toEqual(["type:model", "custom:tag"]);
        expect(privateModel!.tags).toHaveLength(2);

        // Test model without tags still gets type:model
        class NoTagsModel implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .public({
                            modelId: "noTagsModel",
                            name: "No Tags Model",
                            group: "test"
                        })
                        .fields(fields => ({
                            title: fields.text().label("Title")
                        }))
                        .layout([["title"]])
                ];
            }
        }

        const container3 = new Container();
        ModelBuilderFeature.register(container3);
        container3.registerInstance(ModelFactory, new NoTagsModel());
        const noTagsProvider = container3.resolve(ModelsProvider);
        const noTagsModels = await noTagsProvider.list("root");
        const noTagsModel = noTagsModels.find(m => m.modelId === "noTagsModel");

        // Should have only type:model tag
        expect(noTagsModel!.tags).toEqual(["type:model"]);
        expect(noTagsModel!.tags).toHaveLength(1);
    });
});
