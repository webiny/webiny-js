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
        expect(model!.fields).toHaveLength(1);
        const field = model!.fields[0]!;
        expect(field).toEqual({
            description: null,
            fieldId: "alert",
            help: null,
            id: "alert",
            label: "No fields defined in the code content model. Please ensure you have the fields property correctly defined.",
            list: false,
            listValidation: [],
            note: null,
            placeholder: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "uiAlert",
                settings: {
                    type: "warning"
                }
            },
            settings: {},
            storageId: "ui@alert",
            tags: [],
            type: "ui:alert",
            validation: []
        });

        expect(model?.layout).toEqual([["alert"]]);
    });
});
