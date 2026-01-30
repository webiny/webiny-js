import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { ModelBuilderFeature } from "~/features/modelBuilder/feature.js";
import { ModelFactory, ModelsProvider } from "~/features/modelBuilder/index.js";

describe("Private Models", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("should append fields when .fields() is called multiple times", async () => {
        class TestModelImpl implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                // First call - add base fields
                const model = builder
                    .private()
                    .modelId("testModel")
                    .name("Test Model")
                    .fields(fields => ({
                        name: fields.text().label("Name").required(),
                        email: fields.text().label("Email").email()
                    }));

                // Second call - add more fields
                model.fields(fields => ({
                    age: fields.number().label("Age").gte(0),
                    isActive: fields.boolean().label("Is Active")
                }));

                return [model];
            }
        }

        container.registerInstance(ModelFactory, new TestModelImpl());
        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
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
        class ConditionalModelImpl implements ModelFactory.Interface {
            constructor(private includeOptionalFields: boolean) {}

            public async execute(builder: ModelFactory.Builder) {
                // Always add base fields
                const model = builder
                    .private()
                    .modelId("conditionalModel")
                    .name("Conditional Model")
                    .fields(fields => ({
                        title: fields.text().label("Title").required()
                    }));

                // Conditionally add more fields
                if (this.includeOptionalFields) {
                    model.fields(fields => ({
                        description: fields.longText().label("Description"),
                        tags: fields.text().label("Tags").list()
                    }));
                }

                return [model];
            }
        }

        // Test with optional fields included
        container.registerInstance(ModelFactory, new ConditionalModelImpl(true));
        const modelsProvider = container.resolve(ModelsProvider);
        const modelsWithOptional = await modelsProvider.list("root");
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
        container2.registerInstance(ModelFactory, new ConditionalModelImpl(false));
        const providerWithoutOptional = container2.resolve(ModelsProvider);
        const modelsWithoutOptional = await providerWithoutOptional.list("root");
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

    it("should append fields when .fields() is called multiple times on public models", async () => {
        class TestPublicModelImpl implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                // First call - add base fields
                const model = builder
                    .public()
                    .modelId("publicTestModel")
                    .name("Public Test Model")
                    .group("test")
                    .fields(fields => ({
                        title: fields.text().label("Title").required("Title is required."),
                        description: fields.longText().label("Description")
                    }));

                // Second call - add more fields
                model.fields(fields => ({
                    image: fields.file().label("Image").imagesOnly(),
                    tags: fields.text().label("Tags").list()
                }));

                // Add layout for all fields
                model.layout([["title"], ["description"], ["image"], ["tags"]]);

                return [model];
            }
        }

        container.registerInstance(ModelFactory, new TestPublicModelImpl());
        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
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
        class ConditionalPublicModelImpl implements ModelFactory.Interface {
            constructor(private includeValidators: boolean) {}

            public async execute(builder: ModelFactory.Builder) {
                // Always add base fields
                const model = builder
                    .public()
                    .modelId("conditionalPublicModel")
                    .name("Conditional Public Model")
                    .group("test")
                    .fields(fields => ({
                        title: fields.text().label("Title").required("Title is required.")
                    }));

                // Conditionally add more fields with validators
                if (this.includeValidators) {
                    model.fields(fields => ({
                        email: fields.text().label("Email").email(),
                        url: fields.text().label("URL").url(),
                        rating: fields
                            .number()
                            .label("Rating")
                            .gte(1, "Must be at least 1")
                            .lte(5, "Must be at most 5")
                    }));
                    model.layout([["title"], ["email"], ["url"], ["rating"]]);
                } else {
                    model.layout([["title"]]);
                }

                return [model];
            }
        }

        // Test with validators included
        container.registerInstance(ModelFactory, new ConditionalPublicModelImpl(true));
        const providerWithValidators = container.resolve(ModelsProvider);
        const modelsWithValidators = await providerWithValidators.list("root");
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
        container2.registerInstance(ModelFactory, new ConditionalPublicModelImpl(false));
        const providerWithoutValidators = container2.resolve(ModelsProvider);
        const modelsWithoutValidators = await providerWithoutValidators.list("root");
        const modelWithoutValidators = modelsWithoutValidators.find(
            m => m.modelId === "conditionalPublicModel"
        );

        expect(modelWithoutValidators!.fields).toHaveLength(1);
        expect(modelWithoutValidators!.fields.map(f => f.fieldId)).toEqual(["title"]);
    });
});
