import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsGroup, CmsModel, CmsModelField } from "~/types";
import models from "./mocks/contentModels";
import { toSlug } from "~/utils/toSlug";

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

const createExpectedModel = (original: CmsModel, group?: CmsGroup) => {
    return {
        ...original,
        group: {
            id: group ? group.id : original.group.id,
            name: group ? group.name : original.group.name,
            slug: group ? group.slug : toSlug(original.group.name)
        },
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
        path: "manage/en-US"
    };
    const manageDeOpts = {
        path: "manage/de-DE"
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
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                },
                description: "description"
            }
        });
        defaultGroup = createDefaultGroupResponse.data.createContentModelGroup.data;

        const [createCloneGroupResponse] = await createContentModelGroupMutation({
            data: {
                name: "Clone group",
                slug: "clone-group",
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                },
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
                group: defaultGroup.id
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
                group: defaultGroup.id
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
                group: cloneGroup.id
            }
        });

        const expectedModel: CmsModel = createExpectedModel(
            {
                ...originalModel,
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
                group: defaultGroup.id,
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
                        code: "MODEL_ID_EXISTS",
                        data: {
                            input: originalModel.modelId
                        },
                        message: `Content model with modelId "product" already exists.`
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
                group: defaultGroup.id,
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
                        code: "MODEL_ID_EXISTS",
                        data: {
                            input: originalModel.modelId
                        },
                        message: `Content model with modelId "${originalModel.modelId}" already exists.`
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
                group: defaultGroup.id,
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
                        code: "MODEL_SINGULAR_API_NAME_EXISTS",
                        data: {
                            input: originalModel.singularApiName
                        },
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
                group: defaultGroup.id,
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
                        code: "MODEL_PLURAL_API_NAME_EXISTS",
                        data: {
                            input: originalModel.pluralApiName
                        },
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
                group: defaultGroup.id,
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
                        code: "MODEL_PLURAL_API_NAME_EXISTS",
                        data: {
                            input: originalModel.pluralApiName
                        },
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
                group: defaultGroup.id,
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
                        code: "MODEL_SINGULAR_API_NAME_EXISTS",
                        data: {
                            input: originalModel.singularApiName
                        },
                        message: `Content model with singularApiName "${originalModel.singularApiName}" already exists.`
                    }
                }
            }
        });
    });

    it("should clone a model into another locale", async () => {
        const {
            createContentModelGroupMutation: createDeContentModelGroupMutation,
            listContentModelsQuery,
            getContentModelQuery
        } = useGraphQLHandler(manageDeOpts);
        const [createGroupResponse] = await createDeContentModelGroupMutation({
            data: {
                name: "Default group DE",
                slug: "default-group-de",
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                },
                description: "description DE"
            }
        });
        const deGroup = createGroupResponse.data.createContentModelGroup.data;

        const [response] = await createContentModelFromMutation({
            modelId: originalModel.modelId,
            data: {
                name: "Cloned model",
                group: deGroup.id,
                singularApiName: "ClonedModel",
                pluralApiName: "ClonedModels",
                description: "Cloned model description",
                locale: "de-DE"
            }
        });

        const expectedModel: CmsModel = createExpectedModel(
            {
                ...originalModel,
                singularApiName: "ClonedModel",
                pluralApiName: "ClonedModels"
            },
            deGroup
        );

        expect(response).toEqual({
            data: {
                createContentModelFrom: {
                    data: expectedModel,
                    error: null
                }
            }
        });

        const [listDeResponse] = await listContentModelsQuery({});
        expect(listDeResponse).toEqual({
            data: {
                listContentModels: {
                    data: [expectedModel],
                    error: null
                }
            }
        });

        const [getDeResponse] = await getContentModelQuery({
            modelId: "clonedModel"
        });

        expect(getDeResponse).toEqual({
            data: {
                getContentModel: {
                    data: expectedModel,
                    error: null
                }
            }
        });
    });
});
