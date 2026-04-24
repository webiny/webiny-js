import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import {
    ModelBuilderFeature,
    ModelFactory,
    ModelsProvider
} from "~/features/modelBuilder/index.js";

describe("Faulty model definition", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ModelBuilderFeature.register(container);
    });

    it("should set default alert field when no fields are defined", async () => {
        class NoFieldsImpl implements ModelFactory.Interface {
            public async execute(builder: ModelFactory.Builder) {
                return [
                    builder.public({
                        name: "NoFields",
                        modelId: "noFields",
                        group: "test",
                        singularApiName: "NoField",
                        pluralApiName: "NoFields"
                    })
                ];
            }
        }
        // Register the model
        container.registerInstance(ModelFactory, new NoFieldsImpl());

        const modelsProvider = container.resolve(ModelsProvider);
        const models = await modelsProvider.list("root");
        const model = models.find(m => m.modelId === "noFields");

        expect(model).toBeDefined();
        // A dummy emptyPlaceholder text field is added so the GraphQL schema is valid
        expect(model!.fields).toHaveLength(1);
        expect(model!.fields[0]).toMatchObject({
            fieldId: "emptyPlaceholder",
            type: "text",
            label: "Empty"
        });

        // Layout contains the alert descriptor and the placeholder field
        expect(model?.layout).toEqual([
            [
                {
                    type: "alert",
                    label: "No fields defined in the code content model. Please ensure you have the fields property correctly defined.",
                    alertType: "warning"
                }
            ],
            ["emptyPlaceholder"]
        ]);
    });
});
