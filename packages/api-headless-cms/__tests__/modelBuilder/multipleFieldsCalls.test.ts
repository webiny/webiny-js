import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import {
    PrivateModel,
    PrivateModelProvider,
    PublicModel,
    PublicModelProvider,
    type IPrivateModelBuilder,
    type IPublicModelBuilder
} from "~/features/modelBuilder/index.js";
import type { CmsModelGroup } from "~/types/index.js";

describe("Private Models", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("should append fields when .fields() is called multiple times", async () => {
        class TestModelImpl implements PrivateModel.Interface {
            buildModel(builder: IPrivateModelBuilder): IPrivateModelBuilder {
                // First call - add base fields
                builder
                    .modelId("testModel")
                    .name("Test Model")
                    .fields(fields => ({
                        name: fields.text().label("Name").required(),
                        email: fields.text().label("Email").email()
                    }));

                // Second call - add more fields
                builder.fields(fields => ({
                    age: fields.number().label("Age").gte(0),
                    isActive: fields.boolean().label("Is Active")
                }));

                return builder;
            }
        }

        container.registerInstance(PrivateModel, new TestModelImpl());
        const privateModelProvider = container.resolve(PrivateModelProvider);
        const models = await privateModelProvider.getModels();
        const model = models.find(m => m.modelId === "testModel");

        expect(model).toBeDefined();
        expect(model!.fields).toHaveLength(4);

        // Verify all fields are present
        const fieldIds = model!.fields.map(f => f.fieldId);
        expect(fieldIds).toContain("name");
        expect(fieldIds).toContain("email");
        expect(fieldIds).toContain("age");
        expect(fieldIds).toContain("isActive");

        // Verify field order (first call fields, then second call fields)
        expect(fieldIds[0]).toBe("name");
        expect(fieldIds[1]).toBe("email");
        expect(fieldIds[2]).toBe("age");
        expect(fieldIds[3]).toBe("isActive");
    });

    it("should support conditional fields with multiple .fields() calls", async () => {
        class ConditionalModelImpl implements PrivateModel.Interface {
            constructor(private includeOptionalFields: boolean) {}

            buildModel(builder: IPrivateModelBuilder): IPrivateModelBuilder {
                // Always add base fields
                builder
                    .modelId("conditionalModel")
                    .name("Conditional Model")
                    .fields(fields => ({
                        title: fields.text().label("Title").required()
                    }));

                // Conditionally add more fields
                if (this.includeOptionalFields) {
                    builder.fields(fields => ({
                        description: fields.longText().label("Description"),
                        tags: fields.text().label("Tags").multipleValues(true)
                    }));
                }

                return builder;
            }
        }

        // Test with optional fields included
        container.registerInstance(PrivateModel, new ConditionalModelImpl(true));
        const providerWithOptional = container.resolve(PrivateModelProvider);
        const modelsWithOptional = await providerWithOptional.getModels();
        const modelWithOptional = modelsWithOptional.find(m => m.modelId === "conditionalModel");

        expect(modelWithOptional!.fields).toHaveLength(3);
        expect(modelWithOptional!.fields.map(f => f.fieldId)).toEqual([
            "title",
            "description",
            "tags"
        ]);

        // Test without optional fields
        const container2 = new Container();
        ModelBuilderFeature.register(container2);
        container2.registerInstance(PrivateModel, new ConditionalModelImpl(false));
        const providerWithoutOptional = container2.resolve(PrivateModelProvider);
        const modelsWithoutOptional = await providerWithoutOptional.getModels();
        const modelWithoutOptional = modelsWithoutOptional.find(
            m => m.modelId === "conditionalModel"
        );

        expect(modelWithoutOptional!.fields).toHaveLength(1);
        expect(modelWithoutOptional!.fields.map(f => f.fieldId)).toEqual(["title"]);
    });
});

describe("Public Models", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    const testGroup: CmsModelGroup = {
        id: "test-group-id",
        name: "Test Group"
    };

    it("should append fields when .fields() is called multiple times on public models", async () => {
        class TestPublicModelImpl implements PublicModel.Interface {
            buildModel(builder: IPublicModelBuilder): IPublicModelBuilder {
                // First call - add base fields
                builder
                    .modelId("publicTestModel")
                    .name("Public Test Model")
                    .group(testGroup)
                    .fields(fields => ({
                        title: fields.text().label("Title").required("Title is required."),
                        description: fields.longText().label("Description")
                    }));

                // Second call - add more fields
                builder.fields(fields => ({
                    image: fields.file().label("Image").imagesOnly(),
                    tags: fields.text().label("Tags").multipleValues(true)
                }));

                // Add layout for all fields
                builder.layout([["title"], ["description"], ["image"], ["tags"]]);

                return builder;
            }
        }

        container.registerInstance(PublicModel, new TestPublicModelImpl());
        const publicModelProvider = container.resolve(PublicModelProvider);
        const models = await publicModelProvider.getModels();
        const model = models.find(m => m.modelId === "publicTestModel");

        expect(model).toBeDefined();
        expect(model!.fields).toHaveLength(4);

        // Verify all fields are present
        const fieldIds = model!.fields.map(f => f.fieldId);
        expect(fieldIds).toContain("title");
        expect(fieldIds).toContain("description");
        expect(fieldIds).toContain("image");
        expect(fieldIds).toContain("tags");

        // Verify field order (first call fields, then second call fields)
        expect(fieldIds[0]).toBe("title");
        expect(fieldIds[1]).toBe("description");
        expect(fieldIds[2]).toBe("image");
        expect(fieldIds[3]).toBe("tags");
    });

    it("should support conditional fields with multiple .fields() calls on public models", async () => {
        class ConditionalPublicModelImpl implements PublicModel.Interface {
            constructor(private includeValidators: boolean) {}

            buildModel(builder: IPublicModelBuilder): IPublicModelBuilder {
                // Always add base fields
                builder
                    .modelId("conditionalPublicModel")
                    .name("Conditional Public Model")
                    .group(testGroup)
                    .fields(fields => ({
                        title: fields.text().label("Title").required("Title is required.")
                    }));

                // Conditionally add more fields with validators
                if (this.includeValidators) {
                    builder.fields(fields => ({
                        email: fields.text().label("Email").email(),
                        url: fields.text().label("URL").url(),
                        rating: fields
                            .number()
                            .label("Rating")
                            .gte(1, "Must be at least 1")
                            .lte(5, "Must be at most 5")
                    }));
                    builder.layout([["title"], ["email"], ["url"], ["rating"]]);
                } else {
                    builder.layout([["title"]]);
                }

                return builder;
            }
        }

        // Test with validators included
        container.registerInstance(PublicModel, new ConditionalPublicModelImpl(true));
        const providerWithValidators = container.resolve(PublicModelProvider);
        const modelsWithValidators = await providerWithValidators.getModels();
        const modelWithValidators = modelsWithValidators.find(
            m => m.modelId === "conditionalPublicModel"
        );

        expect(modelWithValidators!.fields).toHaveLength(4);
        expect(modelWithValidators!.fields.map(f => f.fieldId)).toEqual([
            "title",
            "email",
            "url",
            "rating"
        ]);

        // Verify validators are applied correctly
        const emailField = modelWithValidators!.fields.find(f => f.fieldId === "email");
        expect(emailField!.validation).toHaveLength(1);
        expect(emailField!.validation[0].name).toBe("pattern");
        expect(emailField!.validation[0].settings?.preset).toBe("email");

        const ratingField = modelWithValidators!.fields.find(f => f.fieldId === "rating");
        expect(ratingField!.validation).toHaveLength(2);
        expect(ratingField!.validation[0].name).toBe("gte");
        expect(ratingField!.validation[1].name).toBe("lte");

        // Test without validators
        const container2 = new Container();
        ModelBuilderFeature.register(container2);
        container2.registerInstance(PublicModel, new ConditionalPublicModelImpl(false));
        const providerWithoutValidators = container2.resolve(PublicModelProvider);
        const modelsWithoutValidators = await providerWithoutValidators.getModels();
        const modelWithoutValidators = modelsWithoutValidators.find(
            m => m.modelId === "conditionalPublicModel"
        );

        expect(modelWithoutValidators!.fields).toHaveLength(1);
        expect(modelWithoutValidators!.fields.map(f => f.fieldId)).toEqual(["title"]);
    });
});
