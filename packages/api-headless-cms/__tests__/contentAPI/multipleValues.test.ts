import { CmsGroup, CmsModelField } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import models from "./mocks/contentModels";

describe("multiple values in field", () => {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useGraphQLHandler(manageOpts);

    // This function is not directly within `beforeEach` as we don't always setup the same content model.
    // We call this function manually at the beginning of each test, where needed.
    const setupContentModelGroup = async (): Promise<CmsGroup> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        return createCMG.data.createContentModelGroup.data;
    };

    test("multiple value field is correctly created", async () => {
        const contentModelGroup = await setupContentModelGroup();

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
                group: contentModelGroup.id
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
            return field.multipleValues === true;
        });

        expect(multipleValueFields).toEqual([
            {
                id: expect.any(String),
                multipleValues: true,
                helpText: "",
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
                placeholderText: "placeholder text",
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

    test("should not allow multipleValue field to be set as title", async () => {
        const contentModelGroup = await setupContentModelGroup();

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
                group: contentModelGroup.id
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
