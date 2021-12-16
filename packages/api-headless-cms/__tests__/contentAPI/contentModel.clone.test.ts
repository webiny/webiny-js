import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsGroup, CmsModel, CmsModelField } from "~/types";
import models from "./mocks/contentModels";

const setEmptyTextsAsNull = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.map(field => {
        field.helpText = field.helpText || null;
        field.placeholderText = field.placeholderText || null;

        if (field?.settings?.fields) {
            field.settings.fields = setEmptyTextsAsNull(field.settings.fields);
        }

        return field;
    });
};

describe("content model - cloning", () => {
    const manageOpts = {
        path: "manage/en-US"
    };

    const {
        createContentModelGroupMutation,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelFromMutation,
        getContentModelQuery,
        listContentModelsQuery
    } = useContentGqlHandler(manageOpts);

    let contentModelGroup: CmsGroup;
    let originalModel: CmsModel;

    beforeEach(async () => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        contentModelGroup = createCMG.data.createContentModelGroup.data;

        const targetModel = models.find(m => m.modelId === "product");
        const [createModelResponse] = await createContentModelMutation({
            data: {
                name: targetModel.name,
                modelId: targetModel.modelId,
                group: contentModelGroup.id
            }
        });
        const createdModel = createModelResponse.data.createContentModel.data;

        const [updateModelResponse] = await updateContentModelMutation({
            modelId: createdModel.modelId,
            data: {
                fields: targetModel.fields,
                layout: targetModel.layout
            }
        });
        originalModel = updateModelResponse.data.updateContentModel.data;
    });

    it("should properly clone content model", async () => {
        const [cloneResponse] = await createContentModelFromMutation({
            modelId: originalModel.modelId,
            data: {
                name: "Cloned model",
                description: "Cloned model description"
            }
        });

        const expectedModel: CmsModel = {
            ...originalModel,
            fields: setEmptyTextsAsNull(originalModel.fields),
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/),
            name: "Cloned model",
            description: "Cloned model description",
            modelId: "clonedModel"
        };

        expect(cloneResponse).toEqual({
            data: {
                createContentModelFrom: {
                    data: expectedModel,
                    error: null
                }
            }
        });

        const clonedModel = cloneResponse.data.createContentModelFrom.data;

        const [getResponse] = await getContentModelQuery({
            modelId: clonedModel.modelId
        });

        expect(getResponse).toEqual({
            data: {
                getContentModel: {
                    data: expectedModel,
                    error: null
                }
            }
        });

        const [listResponse] = await listContentModelsQuery({
            where: {}
        });

        expect(listResponse).toEqual({
            data: {
                listContentModels: {
                    data: [clonedModel, originalModel],
                    error: null
                }
            }
        });
    });

    it("should not allow to clone a model and give it existing modelId", async () => {
        const [cloneResponse] = await createContentModelFromMutation({
            modelId: originalModel.modelId,
            data: {
                name: "Cloned model",
                modelId: originalModel.modelId,
                description: "Cloned model description"
            }
        });

        expect(cloneResponse).toEqual({
            data: {
                createContentModelFrom: {
                    data: null,
                    error: {
                        code: "MODEL_ID_EXISTS",
                        data: {
                            modelId: originalModel.modelId
                        },
                        message: `Content model with modelId "${originalModel.modelId}" already exists.`
                    }
                }
            }
        });
    });
});
