import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import {
    PrivateModel,
    PrivateModelProvider,
    type IPrivateModelBuilder
} from "~/features/modelBuilder/index.js";

describe("All Field Types Model", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("should support all field types with various configurations", async () => {
        class AllFieldsModelImpl implements PrivateModel.Interface {
            buildModel(builder: IPrivateModelBuilder): IPrivateModelBuilder {
                return builder
                    .modelId("allFieldsModel")
                    .name("All Fields Model")
                    .fields(fields => ({
                        // Text field - basic
                        title: fields
                            .text()
                            .label("Title")
                            .validation({ name: "required", message: "Title is required." }),

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
                            .min(1, "Must be at least 1")
                            .max(5, "Must be at most 5"),

                        // Boolean field with default
                        isPublished: fields.boolean().label("Is Published").defaultValue(false),

                        // File field - basic
                        attachment: fields.file().label("Attachment"),

                        // File field - images only
                        coverImage: fields.file().label("Cover Image").imagesOnly(),

                        // File field - multiple
                        gallery: fields.file().label("Gallery").imagesOnly().multipleValues(true),

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
                            .multipleValues(true)
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
                            })),

                        // Object field - multiple (repeatable)
                        sections: fields
                            .object()
                            .label("Sections")
                            .multipleValues(true)
                            .fields(objFields => ({
                                title: objFields.text().label("Section Title"),
                                content: objFields.richText().label("Section Content"),
                                order: objFields.number().label("Order")
                            })),

                        // Dynamic Zone field
                        dynamicContent: fields
                            .dynamicZone()
                            .label("Dynamic Content")
                            .multipleValues(true)
                            .template("textBlock", {
                                name: "Text Block",
                                gqlTypeName: "TextBlock",
                                icon: "fas/paragraph",
                                description: "A simple text block",
                                fields: f => ({
                                    heading: f.text().label("Heading"),
                                    body: f.longText().label("Body")
                                })
                            })
                            .template("imageBlock", {
                                name: "Image Block",
                                gqlTypeName: "ImageBlock",
                                icon: "fas/image",
                                description: "An image with caption",
                                fields: f => ({
                                    image: f.file().label("Image").imagesOnly(),
                                    caption: f.text().label("Caption"),
                                    altText: f.text().label("Alt Text")
                                })
                            })
                            .template("statsBlock", {
                                name: "Stats Block",
                                gqlTypeName: "StatsBlock",
                                icon: "fas/chart-bar",
                                description: "Display statistics",
                                fields: f => ({
                                    stats: f
                                        .object()
                                        .label("Stats")
                                        .multipleValues(true)
                                        .fields(statFields => ({
                                            label: statFields.text().label("Label"),
                                            value: statFields.number().label("Value"),
                                            trend: statFields
                                                .text()
                                                .label("Trend")
                                                .predefinedValues({
                                                    enabled: true,
                                                    values: [
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
                                                    ]
                                                })
                                        }))
                                })
                            })
                    }));
            }
        }

        // Register the model
        container.registerInstance(PrivateModel, new AllFieldsModelImpl());

        // Get the model via provider
        const privateModelProvider = container.resolve(PrivateModelProvider);
        const models = await privateModelProvider.getModels();
        const model = models.find(m => m.modelId === "allFieldsModel");

        // Verify model was created
        expect(model).toBeDefined();
        expect(model!.modelId).toBe("allFieldsModel");
        expect(model!.name).toBe("All Fields Model");
        expect(model!.titleFieldId).toBe("title");

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

        const sectionsField = model!.fields.find(f => f.fieldId === "sections");
        expect(sectionsField?.type).toBe("object");
        expect(sectionsField?.multipleValues).toBe(true);
        expect(sectionsField?.settings?.fields?.length).toBe(3);

        const dynamicContentField = model!.fields.find(f => f.fieldId === "dynamicContent");
        expect(dynamicContentField?.type).toBe("dynamicZone");
        expect(dynamicContentField?.multipleValues).toBe(true);
        expect(dynamicContentField?.settings?.templates).toHaveLength(3);
        expect(dynamicContentField?.settings?.templates[0].gqlTypeName).toBe("TextBlock");
        expect(dynamicContentField?.settings?.templates[1].gqlTypeName).toBe("ImageBlock");
        expect(dynamicContentField?.settings?.templates[2].gqlTypeName).toBe("StatsBlock");

        // Verify nested object in dynamic zone template has stats with predefined values
        const statsTemplate = dynamicContentField?.settings?.templates[2];
        expect(statsTemplate?.fields).toHaveLength(1);
        const statsField = statsTemplate?.fields[0];
        expect(statsField.fieldId).toBe("stats");
        expect(statsField.type).toBe("object");
        expect(statsField.multipleValues).toBe(true);
        expect(statsField.settings.fields).toHaveLength(3);
        const trendField = statsField.settings.fields.find((f: any) => f.fieldId === "trend");
        expect(trendField.predefinedValues.enabled).toBe(true);
        expect(trendField.predefinedValues.values).toHaveLength(3);
    });
});
