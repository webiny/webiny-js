import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import { ModelFactory, ModelsProvider } from "~/features/modelBuilder/index.js";

describe("Object Field Multiple .fields() Calls", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("should append fields when .fields() is called multiple times on object field", async () => {
        class TestModelImpl implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .private()
                        .modelId("testObjectMultipleFields")
                        .name("Test Object Multiple Fields")
                        .fields(fields => ({
                            metadata: fields
                                .object()
                                .label("Metadata")
                                .fields(objFields => ({
                                    // First call - add base fields
                                    title: objFields.text().label("Title"),
                                    description: objFields.longText().label("Description")
                                }))
                                .fields(objFields => ({
                                    // Second call - add more fields
                                    author: objFields.text().label("Author"),
                                    date: objFields.datetime().label("Date")
                                }))
                        }))
                ];
            }
        }

        container.registerInstance(ModelFactory, new TestModelImpl());
        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
        const model = models.find(m => m.modelId === "testObjectMultipleFields");

        expect(model).toBeDefined();
        expect(model!.fields).toHaveLength(1);

        const metadataField = model!.fields[0];
        expect(metadataField.fieldId).toBe("metadata");
        expect(metadataField.type).toBe("object");
        expect(metadataField.settings?.fields).toHaveLength(4);

        // Verify all fields are present
        const fieldIds = metadataField.settings!.fields!.map((f: any) => f.fieldId);
        expect(fieldIds).toContain("title");
        expect(fieldIds).toContain("description");
        expect(fieldIds).toContain("author");
        expect(fieldIds).toContain("date");

        // Verify field order (first call fields, then second call fields)
        expect(fieldIds[0]).toBe("title");
        expect(fieldIds[1]).toBe("description");
        expect(fieldIds[2]).toBe("author");
        expect(fieldIds[3]).toBe("date");
    });

    it("should support conditional fields with multiple .fields() calls on object field", async () => {
        class ConditionalObjectModelImpl implements ModelFactory.Interface {
            constructor(private includeExtendedMetadata: boolean) {}

            public async execute(builder: ModelFactory.Builder) {
                // Create object field with base fields
                const metadataBuilder = (fields: ModelFactory.FieldBuilder) => {
                    const objField = fields
                        .object()
                        .label("Metadata")
                        .fields(objFields => ({
                            title: objFields.text().label("Title").required()
                        }));

                    // Conditionally add more fields
                    if (this.includeExtendedMetadata) {
                        objField.fields(objFields => ({
                            source: objFields.text().label("Source"),
                            tags: objFields.text().label("Tags").list()
                        }));
                    }

                    return objField;
                };

                return [
                    builder
                        .private()
                        .modelId("conditionalObjectModel")
                        .name("Conditional Object Model")
                        .fields(fields => ({
                            metadata: metadataBuilder(fields)
                        }))
                ];
            }
        }

        // Test with extended metadata included
        container.registerInstance(ModelFactory, new ConditionalObjectModelImpl(true));
        const providerWithExtended = container.resolve(ModelsProvider);
        const modelsWithExtended = await providerWithExtended.list("root");
        const modelWithExtended = modelsWithExtended.find(
            m => m.modelId === "conditionalObjectModel"
        );

        expect(modelWithExtended).toBeDefined();
        const metadataFieldExtended = modelWithExtended!.fields[0];
        expect(metadataFieldExtended.settings?.fields).toHaveLength(3);
        expect(metadataFieldExtended.settings!.fields!.map((f: any) => f.fieldId)).toEqual([
            "title",
            "source",
            "tags"
        ]);

        // Test without extended metadata
        const container2 = new Container();
        ModelBuilderFeature.register(container2);
        container2.registerInstance(ModelFactory, new ConditionalObjectModelImpl(false));
        const providerWithoutExtended = container2.resolve(ModelsProvider);
        const modelsWithoutExtended = await providerWithoutExtended.list("root");
        const modelWithoutExtended = modelsWithoutExtended.find(
            m => m.modelId === "conditionalObjectModel"
        );

        expect(modelWithoutExtended).toBeDefined();
        const metadataFieldBasic = modelWithoutExtended!.fields[0];
        expect(metadataFieldBasic.settings?.fields).toHaveLength(1);
        expect(metadataFieldBasic.settings!.fields!.map((f: any) => f.fieldId)).toEqual(["title"]);
    });

    it("should support nested object fields with multiple .fields() calls", async () => {
        class NestedObjectModelImpl implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                return [
                    builder
                        .private()
                        .modelId("nestedObjectModel")
                        .name("Nested Object Model")
                        .fields(fields => ({
                            section: fields
                                .object()
                                .label("Section")
                                .fields(objFields => ({
                                    header: objFields.text().label("Header")
                                }))
                                .fields(objFields => {
                                    const content = objFields
                                        .object()
                                        .label("Content")
                                        .fields(contentFields => ({
                                            body: contentFields.longText().label("Body")
                                        }));

                                    content.fields(contentFields => ({
                                        footer: contentFields.text().label("Footer")
                                    }));

                                    return {
                                        content
                                    };
                                })
                        }))
                ];
            }
        }

        container.registerInstance(ModelFactory, new NestedObjectModelImpl());
        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
        const model = models.find(m => m.modelId === "nestedObjectModel");

        expect(model).toBeDefined();

        // Check outer object field
        const sectionField = model!.fields[0];
        expect(sectionField.fieldId).toBe("section");
        expect(sectionField.settings?.fields).toHaveLength(2);

        const sectionFieldIds = sectionField.settings!.fields!.map((f: any) => f.fieldId);
        expect(sectionFieldIds).toEqual(["header", "content"]);

        // Check nested object field
        const contentField = sectionField.settings!.fields![1];
        expect(contentField.fieldId).toBe("content");
        expect(contentField.type).toBe("object");
        expect(contentField.settings?.fields).toHaveLength(2);

        const contentFieldIds = contentField.settings!.fields!.map((f: any) => f.fieldId);
        expect(contentFieldIds).toEqual(["body", "footer"]);
    });
});
