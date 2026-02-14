import { beforeEach, describe, expect, it } from "vitest";
import { type CmsGroup, CmsModelField } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import models from "./mocks/contentModels";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

describe("multiple values in field", () => {
    const manageOpts = { path: "manage" };

    const manager = useGraphQLHandler(manageOpts);
    const { createContentModelMutation, updateContentModelMutation } = manager;

    let contentModelGroup: CmsGroup;

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager,
            models: undefined
        });
        contentModelGroup = result.group;
    });

    it("multiple value field is correctly created", async () => {
        const model = models.find(m => m.modelId === "product");
        if (!model) {
            throw new Error(`Could not find model "product".`);
        }
        const [createResponse] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                singularApiName: model.singularApiName,
                pluralApiName: model.pluralApiName,
                group: contentModelGroup.slug
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const [updateResponse] = await updateContentModelMutation({
            modelId: contentModel.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });

        const updatedContentModel: any = updateResponse.data.updateContentModel.data;

        const multipleValueFields = updatedContentModel.fields.filter((field: CmsModelField) => {
            return field.list === true;
        });

        expect(multipleValueFields).toEqual([
            {
                id: expect.any(String),
                list: true,
                help: null,
                label: "Available sizes",
                storageId: expect.stringMatching("text@"),
                fieldId: "availableSizes",
                type: "text",
                settings: {
                    type: "text"
                },
                validation: [
                    {
                        name: "required",
                        message: "Please select from list of sizes",
                        settings: {}
                    }
                ],
                listValidation: [],
                placeholder: "placeholder text",
                tags: [],
                predefinedValues: {
                    enabled: true,
                    values: [
                        {
                            label: "s",
                            value: "s"
                        },
                        {
                            label: "m",
                            value: "m"
                        },
                        {
                            label: "l",
                            value: "l"
                        },
                        {
                            label: "xl",
                            value: "xl"
                        }
                    ]
                },
                renderer: {
                    name: "renderer"
                }
            }
        ]);
    });

    it("should not allow multipleValue field to be set as title", async () => {
        const model = models.find(m => m.modelId === "product");
        if (!model) {
            throw new Error(`Could not find model "product".`);
        }
        const [createResponse] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                singularApiName: model.singularApiName,
                pluralApiName: model.pluralApiName,
                group: contentModelGroup.slug
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const [response] = await updateContentModelMutation({
            modelId: contentModel.modelId,
            data: {
                titleFieldId: "availableSizes",
                fields: model.fields,
                layout: model.layout
            }
        });

        expect(response).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        titleFieldId: "title"
                    },
                    error: null
                }
            }
        });
    });
});
