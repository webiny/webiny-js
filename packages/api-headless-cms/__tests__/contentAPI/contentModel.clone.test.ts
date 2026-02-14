import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsGroup, CmsModel, CmsModelField } from "~/types";
import models from "./mocks/contentModels";
import { createIcon } from "~tests/__helpers/icon.js";

const setEmptyTextsAsNull = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.map(field => {
        field.help = field.help || null;
        field.placeholder = field.placeholder || null;

        if (field?.settings?.fields) {
            field.settings.fields = setEmptyTextsAsNull(field.settings.fields);
        }

        return field;
    });
};

const createExpectedModel = (original: CmsModel, group?: CmsGroup) => {
    return {
        ...original,
        group: group ? group.slug : original.group,
        fields: setEmptyTextsAsNull(original.fields),
        createdOn: expect.stringMatching(/^20/),
        savedOn: expect.stringMatching(/^20/),
        name: "Cloned model",
        description: "Cloned model description",
        modelId: "clonedModel"
    };
};

describe("content model - cloning", () => {
    const manageOpts = {
        path: "manage"
    };

    const {
        createContentModelGroupMutation,
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelFromMutation,
        getContentModelQuery,
        listContentModelsQuery
    } = useGraphQLHandler(manageOpts);

    let defaultGroup: CmsGroup;
    let cloneGroup: CmsGroup;
    let originalModel: CmsModel;

    beforeEach(async () => {
        const [createDefaultGroupResponse] = await createContentModelGroupMutation({
            data: {
                name: "Default group",
                slug: "default-group",
                icon: createIcon("ico/ico"),
                description: "description"
            }
        });
        defaultGroup = createDefaultGroupResponse.data.createContentModelGroup.data;

        const [createCloneGroupResponse] = await createContentModelGroupMutation({
            data: {
                name: "Clone group",
                slug: "clone-group",
                icon: createIcon("ico/ico"),
                description: "description"
            }
        });
        cloneGroup = createCloneGroupResponse.data.createContentModelGroup.data;

        const targetModel = models.find(m => m.modelId === "product");
        if (!targetModel) {
            throw new Error("Could not find model `product`.");
        }
        const [createModelResponse] = await createContentModelMutation({
            data: {
                name: targetModel.name,
                modelId: targetModel.modelId,
                singularApiName: targetModel.singularApiName,
                pluralApiName: targetModel.pluralApiName,
                group: defaultGroup.slug
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
                description: "Cloned model description",
                singularApiName: "ClonedModel",
                pluralApiName: "ClonedModels",
                group: defaultGroup.slug
            }
        });

        const expectedModel: CmsModel = createExpectedModel({
            ...originalModel,
            singularApiName: "ClonedModel",
            pluralApiName: "ClonedModels"
        });

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

    it("should change the group of cloned model", async () => {
        const [cloneResponse] = await createContentModelFromMutation({
            modelId: originalModel.modelId,
            data: {
                name: "Cloned model",
                description: "Cloned model description",
                singularApiName: "ClonedModel",
                pluralApiName: "ClonedModels",
                group: cloneGroup.slug
            }
        });

        const expectedModel: CmsModel = createExpectedModel(
            {
                ...originalModel,
                group: cloneGroup.slug,
                singularApiName: "ClonedModel",
                pluralApiName: "ClonedModels"
            },
            cloneGroup
        );

        expect(cloneResponse).toEqual({
            data: {
                createContentModelFrom: {
                    data: expectedModel,
                    error: null
                }
            }
        });
    });

    it("should not allow to clone a model without modelId and name change", async () => {
        const [cloneResponse] = await createContentModelFromMutation({
            modelId: originalModel.modelId,
            data: {
                name: originalModel.name,
                group: defaultGroup.slug,
                singularApiName: originalModel.singularApiName,
                pluralApiName: originalModel.pluralApiName,
                description: "Cloned model description"
            }
        });

        expect(cloneResponse).toEqual({
            data: {
                createContentModelFrom: {
                    data: null,
                    error: {
                        code: "Cms/Model/AlreadyExists",
                        data: {
                            modelId: originalModel.modelId
                        },
                        message: `Model "${originalModel.modelId}" already exists!`
                    }
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
                group: defaultGroup.slug,
                singularApiName: "ClonedModel",
                pluralApiName: "ClonedModels",
                description: "Cloned model description"
            }
        });

        expect(cloneResponse).toEqual({
            data: {
                createContentModelFrom: {
                    data: null,
                    error: {
                        code: "Cms/Model/AlreadyExists",
                        data: {
                            modelId: originalModel.modelId
                        },
                        message: `Model "${originalModel.modelId}" already exists!`
                    }
                }
            }
        });
    });

    it("should not allow to clone a model and give it existing singularApiName - sending exact singularApiName", async () => {
        const [cloneResponse] = await createContentModelFromMutation({
            modelId: originalModel.modelId,
            data: {
                name: "Cloned model",
                modelId: "clonedModel",
                group: defaultGroup.slug,
                singularApiName: originalModel.singularApiName,
                pluralApiName: "ClonedModels",
                description: "Cloned model description"
            }
        });
        expect(cloneResponse).toEqual({
            data: {
                createContentModelFrom: {
                    data: null,
                    error: {
                        code: "Cms/Model/ValidationError",
                        data: null,
                        message: `Content model with singularApiName "${originalModel.singularApiName}" already exists.`
                    }
                }
            }
        });
    });

    it("should not allow to clone a model and give it existing singularApiName - sending exact pluralApiName", async () => {
        const [cloneResponse] = await createContentModelFromMutation({
            modelId: originalModel.modelId,
            data: {
                name: "Cloned model",
                modelId: "clonedModel",
                group: defaultGroup.slug,
                singularApiName: originalModel.pluralApiName,
                pluralApiName: "ClonedModels",
                description: "Cloned model description"
            }
        });
        expect(cloneResponse).toEqual({
            data: {
                createContentModelFrom: {
                    data: null,
                    error: {
                        code: "Cms/Model/ValidationError",
                        data: null,
                        message: `Content model with pluralApiName "${originalModel.pluralApiName}" already exists.`
                    }
                }
            }
        });
    });

    it("should not allow to clone a model and give it existing pluralApiName - sending exact pluralApiName", async () => {
        const [cloneResponse] = await createContentModelFromMutation({
            modelId: originalModel.modelId,
            data: {
                name: "Cloned model",
                modelId: "clonedModel",
                group: defaultGroup.slug,
                singularApiName: "ClonedModel",
                pluralApiName: originalModel.pluralApiName,
                description: "Cloned model description"
            }
        });
        expect(cloneResponse).toEqual({
            data: {
                createContentModelFrom: {
                    data: null,
                    error: {
                        code: "Cms/Model/ValidationError",
                        data: null,
                        message: `Content model with pluralApiName "${originalModel.pluralApiName}" already exists.`
                    }
                }
            }
        });
    });

    it("should not allow to clone a model and give it existing pluralApiName - sending exact singularApiName", async () => {
        const [cloneResponse] = await createContentModelFromMutation({
            modelId: originalModel.modelId,
            data: {
                name: "Cloned model",
                modelId: "clonedModel",
                group: defaultGroup.slug,
                singularApiName: "ClonedModel",
                pluralApiName: originalModel.singularApiName,
                description: "Cloned model description"
            }
        });
        expect(cloneResponse).toEqual({
            data: {
                createContentModelFrom: {
                    data: null,
                    error: {
                        code: "Cms/Model/ValidationError",
                        data: null,
                        message: `Content model with singularApiName "${originalModel.singularApiName}" already exists.`
                    }
                }
            }
        });
    });
});
