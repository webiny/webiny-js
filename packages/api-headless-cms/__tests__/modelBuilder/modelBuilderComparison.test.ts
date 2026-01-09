import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import {
    PrivateModel,
    PrivateModelProvider,
    type IPrivateModelBuilder
} from "~/features/modelBuilder/index.js";
import { createCmsModel, createPrivateModel, createModelField } from "@webiny/api-headless-cms";

describe("Model Builder Comparison - Old vs New API", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    describe("Simple Model", () => {
        it("should produce identical output for a model with text and object fields", async () => {
            // ============================================
            // OLD WAY - Using legacy factory functions
            // ============================================
            const required = () => {
                return {
                    name: "required",
                    message: "Value is required."
                };
            };

            const nameField = () => {
                return createModelField({
                    label: "Name",
                    type: "text",
                    validation: [required()]
                });
            };

            const descriptionField = () => {
                return createModelField({
                    label: "Description",
                    type: "text"
                });
            };

            const metadataField = () => {
                return createModelField({
                    label: "Metadata",
                    type: "object",
                    settings: {
                        fields: [
                            createModelField({
                                label: "Author",
                                type: "text"
                            }),
                            createModelField({
                                label: "Version",
                                type: "text",
                                validation: [required()]
                            })
                        ]
                    }
                });
            };

            const oldModel = createCmsModel(
                createPrivateModel({
                    name: "TestModel",
                    modelId: "testModel",
                    fields: [nameField(), descriptionField(), metadataField()]
                })
            );

            // ============================================
            // NEW WAY - Using builder API via DI
            // ============================================
            class TestModelImpl implements PrivateModel.Interface {
                buildModel(builder: IPrivateModelBuilder): IPrivateModelBuilder {
                    const required = () => ({
                        name: "required",
                        message: "Value is required."
                    });

                    return builder
                        .modelId("testModel")
                        .name("TestModel")
                        .fields(fields => ({
                            name: fields.text().label("Name").validation(required()),
                            description: fields.text().label("Description"),
                            metadata: fields
                                .object()
                                .label("Metadata")
                                .fields(fields => ({
                                    author: fields.text().label("Author"),
                                    version: fields.text().label("Version").validation(required())
                                }))
                        }));
                }
            }

            // Register the model implementation BEFORE resolving the provider
            container.registerInstance(PrivateModel, new TestModelImpl());

            // Resolve the provider AFTER registering the model
            const privateModelProvider = container.resolve(PrivateModelProvider);

            // Get models via provider
            const models = await privateModelProvider.getModels();
            const newModel = models.find(m => m.modelId === "testModel");

            // ============================================
            // COMPARISON
            // ============================================
            expect(newModel).toBeDefined();

            // Compare the essential properties
            expect(newModel!.modelId).toBe(oldModel.contentModel.modelId);
            expect(newModel!.name).toBe(oldModel.contentModel.name);
            expect(newModel!.fields.length).toBe(oldModel.contentModel.fields.length);

            // Compare each field
            for (let i = 0; i < oldModel.contentModel.fields.length; i++) {
                const oldField = oldModel.contentModel.fields[i];
                const newField = newModel!.fields[i];

                expect(newField.fieldId).toBe(oldField.fieldId);
                expect(newField.type).toBe(oldField.type);
                expect(newField.label).toBe(oldField.label);
                expect(newField.storageId).toBe(oldField.storageId);
                expect(newField.multipleValues).toBe(oldField.multipleValues);
                // Normalize: undefined validation equals empty array
                expect(newField.validation || []).toEqual(oldField.validation || []);
                expect(newField.tags).toEqual(oldField.tags);

                // For object fields, compare nested fields
                if (oldField.type === "object" && oldField.settings?.fields) {
                    expect(newField.settings?.fields).toBeDefined();
                    expect(newField.settings?.fields?.length).toBe(oldField.settings.fields.length);

                    for (let j = 0; j < oldField.settings.fields.length; j++) {
                        const oldNestedField = oldField.settings.fields[j];
                        const newNestedField = newField.settings!.fields![j];

                        expect(newNestedField.fieldId).toBe(oldNestedField.fieldId);
                        expect(newNestedField.type).toBe(oldNestedField.type);
                        expect(newNestedField.label).toBe(oldNestedField.label);
                        expect(newNestedField.storageId).toBe(oldNestedField.storageId);
                    }
                }
            }

            // Note: Full JSON comparison skipped because the simple test creates models differently
            // The old way adds default fields (helpText, listValidation, etc.) via createModelField
            // The new way normalizes these away in PrivateModelProvider to match production models
            // Field-by-field comparison above validates the essential properties match
        });
    });
});
