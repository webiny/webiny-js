// @ts-ignore
import mdbid from "mdbid";
import { CmsModelFieldInput, CmsGroup, CmsModelField } from "~/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import * as helpers from "../utils/helpers";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { pubSubTracker, assignModelEvents } from "./mocks/lifecycleHooks";
import { useBugManageHandler } from "../utils/useBugManageHandler";

const getTypeFields = (type: any) => {
    return type.fields.filter((f: any) => f.name !== "_empty").map((f: any) => f.name);
};

const getTypeObject = (schema: any, type: string) => {
    return schema.types.find((t: any) => t.name === type);
};

const createPermissions = ({ models, groups }: { models?: string[]; groups?: string[] }) => [
    {
        name: "cms.settings"
    },
    {
        name: "cms.contentModelGroup",
        rwd: "rwd",
        groups: groups ? { "en-US": groups } : undefined
    },
    {
        name: "cms.contentModel",
        rwd: "rwd",
        models: models ? { "en-US": models } : undefined
    },
    {
        name: "cms.endpoint.read"
    },
    {
        name: "cms.endpoint.manage"
    },
    {
        name: "cms.endpoint.preview"
    },
    {
        name: "content.i18n",
        locales: ["en-US"]
    }
];

jest.setTimeout(100000);

describe("content model test", () => {
    const readHandlerOpts = { path: "read/en-US" };
    const manageHandlerOpts = { path: "manage/en-US" };

    const { createContentModelGroupMutation } = useContentGqlHandler(manageHandlerOpts);

    let contentModelGroup: CmsGroup;

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
        // we need to reset this since we are using a singleton
        pubSubTracker.reset();
    });

    test("base schema should only contain relevant queries and mutations", async () => {
        // create a "read" and "manage" endpoints
        const readAPI = useContentGqlHandler(readHandlerOpts);
        const manageAPI = useContentGqlHandler(manageHandlerOpts);

        const [read] = await readAPI.introspect();
        const [manage] = await manageAPI.introspect();

        const readSchema = read.data.__schema;
        const manageSchema = manage.data.__schema;

        const ReadQuery = getTypeObject(readSchema, "Query");
        const ManageQuery = getTypeObject(manageSchema, "Query");
        const ReadMutation = getTypeObject(readSchema, "Mutation");
        const ManageMutation = getTypeObject(manageSchema, "Mutation");

        expect(getTypeFields(ReadQuery)).toEqual(["getContentModel", "listContentModels"]);
        expect(getTypeFields(ManageQuery)).toEqual([
            "getContentModel",
            "listContentModels",
            "searchContentEntries",
            "getContentEntry",
            "getLatestContentEntry",
            "getPublishedContentEntry",
            "getContentEntries",
            "getLatestContentEntries",
            "getPublishedContentEntries",
            "getContentModelGroup",
            "listContentModelGroups"
        ]);
        expect(getTypeFields(ReadMutation)).toEqual([]);
        expect(getTypeFields(ManageMutation)).toEqual([
            "createContentModel",
            "createContentModelFrom",
            "updateContentModel",
            "deleteContentModel",
            "createContentModelGroup",
            "updateContentModelGroup",
            "deleteContentModelGroup"
        ]);
    });

    test("create, read, update, delete and list content models", async () => {
        const {
            createContentModelMutation,
            getContentModelQuery,
            updateContentModelMutation,
            listContentModelsQuery,
            deleteContentModelMutation
        } = useContentGqlHandler(manageHandlerOpts);

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                group: contentModelGroup.id
            }
        });

        expect(createResponse).toEqual({
            data: {
                createContentModel: {
                    data: {
                        name: "Test Content model",
                        description: "",
                        titleFieldId: "id",
                        modelId: "testContentModel",
                        createdBy: helpers.identity,
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        fields: [],
                        layout: [],
                        plugin: false,
                        group: {
                            id: contentModelGroup.id,
                            name: contentModelGroup.name
                        }
                    },
                    error: null
                }
            }
        });
        const createdContentModel = createResponse.data.createContentModel.data;

        const [getResponse] = await getContentModelQuery({
            modelId: createdContentModel.modelId
        });

        expect(getResponse).toEqual({
            data: {
                getContentModel: {
                    data: {
                        ...createResponse.data.createContentModel.data,
                        description: null
                    },
                    error: null
                }
            }
        });

        // nothing is changed in this update - just the date
        const [updateResponse] = await updateContentModelMutation({
            modelId: createdContentModel.modelId,
            data: {
                fields: [],
                layout: []
            }
        });

        expect(updateResponse).toEqual({
            data: {
                updateContentModel: {
                    data: {
                        ...createResponse.data.createContentModel.data,
                        description: null,
                        savedOn: expect.stringMatching(/^20/)
                    },
                    error: null
                }
            }
        });

        // change some values in content model
        const [changedUpdateResponse] = await updateContentModelMutation({
            modelId: createdContentModel.modelId,
            data: {
                name: "changed name",
                description: "changed description",
                fields: [],
                layout: []
            }
        });

        const updatedContentModel = {
            ...createdContentModel,
            name: "changed name",
            description: "changed description",
            savedOn: expect.stringMatching(/^20/)
        };

        expect(changedUpdateResponse).toEqual({
            data: {
                updateContentModel: {
                    data: updatedContentModel,
                    error: null
                }
            }
        });

        const [listResponse] = await listContentModelsQuery();

        expect(listResponse).toEqual({
            data: {
                listContentModels: {
                    data: [updatedContentModel],
                    error: null
                }
            }
        });

        const [deleteResponse] = await deleteContentModelMutation({
            modelId: updatedContentModel.modelId
        });

        expect(deleteResponse).toEqual({
            data: {
                deleteContentModel: {
                    data: true,
                    error: null
                }
            }
        });
    });

    test("delete existing content model", async () => {
        const { createContentModelMutation, deleteContentModelMutation } =
            useContentGqlHandler(manageHandlerOpts);

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const [response] = await deleteContentModelMutation({
            modelId: contentModel.modelId
        });

        expect(response).toEqual({
            data: {
                deleteContentModel: {
                    data: true,
                    error: null
                }
            }
        });
    });

    test("cannot delete content model that has entries", async () => {
        const {
            createContentModelMutation,
            updateContentModelMutation,
            deleteContentModelMutation
        } = useContentGqlHandler(manageHandlerOpts);
        const { createCategory, until, listCategories } =
            useCategoryManageHandler(manageHandlerOpts);
        const category = models.find(m => m.modelId === "category");
        if (!category) {
            throw new Error("Could not find model `category`.");
        }

        // Create initial record
        const [createContentModelResponse] = await createContentModelMutation({
            data: {
                name: category.name,
                modelId: category.modelId,
                group: contentModelGroup.id
            }
        });

        const [updateContentModelResponse] = await updateContentModelMutation({
            modelId: createContentModelResponse.data.createContentModel.data.modelId,
            data: {
                fields: category.fields,
                layout: category.layout
            }
        });

        const model = updateContentModelResponse.data.updateContentModel.data;

        await createCategory({
            data: {
                title: "Category",
                slug: "title"
            }
        });

        // If this `until` resolves successfully, we know entry is accessible via the "read" API
        await until(
            () => listCategories().then(([data]) => data),
            ({ data }: any) => data.listCategories.data.length > 0,
            { name: "list categories to check that categories are available" }
        );

        const [response] = await deleteContentModelMutation({
            modelId: model.modelId
        });

        expect(response).toEqual({
            data: {
                deleteContentModel: {
                    data: null,
                    error: {
                        message: `Cannot delete content model "${model.modelId}" because there are existing entries.`,
                        code: "CONTENT_MODEL_BEFORE_DELETE_HOOK_FAILED",
                        data: null
                    }
                }
            }
        });
    });

    test("get existing content model", async () => {
        const { createContentModelMutation, getContentModelQuery } =
            useContentGqlHandler(manageHandlerOpts);

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const [response] = await getContentModelQuery({
            modelId: contentModel.modelId
        });

        expect(response).toEqual({
            data: {
                getContentModel: {
                    data: {
                        ...contentModel,
                        description: null
                    },
                    error: null
                }
            }
        });
    });

    test("error when getting non-existing model", async () => {
        const { getContentModelQuery } = useContentGqlHandler(manageHandlerOpts);
        const modelId = "nonExistingId";
        const [response] = await getContentModelQuery({
            modelId
        });

        expect(response).toEqual({
            data: {
                getContentModel: {
                    data: null,
                    error: {
                        message: `Content model "${modelId}" was not found!`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    test("error when updating non-existing model", async () => {
        const { updateContentModelMutation } = useContentGqlHandler(manageHandlerOpts);
        const modelId = "nonExistingId";
        const [response] = await updateContentModelMutation({
            modelId,
            data: {
                name: "new name",
                fields: [],
                layout: []
            }
        });

        expect(response).toEqual({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        message: `Content model "${modelId}" was not found!`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    test("error when deleting non-existing model", async () => {
        const { deleteContentModelMutation } = useContentGqlHandler(manageHandlerOpts);

        const modelId = "nonExistingId";
        const [response] = await deleteContentModelMutation({
            modelId
        });

        expect(response).toEqual({
            data: {
                deleteContentModel: {
                    data: null,
                    error: {
                        message: `Content model "${modelId}" was not found!`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    test("update content model with new fields", async () => {
        const { createContentModelMutation, updateContentModelMutation } =
            useContentGqlHandler(manageHandlerOpts);
        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const textField: CmsModelFieldInput = {
            id: mdbid(),
            fieldId: "textField",
            label: "Text field",
            helpText: "help text",
            multipleValues: false,
            placeholderText: "placeholder text",
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "rendererName"
            },
            settings: {},
            type: "text",
            validation: [],
            listValidation: []
        };
        const numberField: CmsModelFieldInput = {
            id: mdbid(),
            fieldId: "numberField",
            label: "Number field",
            helpText: "number help text",
            multipleValues: false,
            placeholderText: "number placeholder text",
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "rendererName"
            },
            settings: {},
            type: "number",
            validation: [],
            listValidation: []
        };

        const fields = [textField, numberField];
        const [response] = await updateContentModelMutation({
            modelId: contentModel.modelId,
            data: {
                name: "new name",
                fields,
                layout: fields.map(field => {
                    return [field.id];
                })
            }
        });

        expect(response).toEqual({
            data: {
                updateContentModel: {
                    data: {
                        savedOn: expect.stringMatching(/^20/),
                        createdBy: helpers.identity,
                        createdOn: expect.stringMatching(/^20/),
                        description: null,
                        titleFieldId: "textField",
                        fields: [textField, numberField],
                        group: {
                            id: contentModelGroup.id,
                            name: "Group"
                        },
                        modelId: contentModel.modelId,
                        layout: [[textField.id], [numberField.id]],
                        name: "new name",
                        plugin: false
                    },
                    error: null
                }
            }
        });
    });

    test("error when assigning titleFieldId on non existing field", async () => {
        const { createContentModelMutation, updateContentModelMutation } =
            useContentGqlHandler(manageHandlerOpts);
        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const field: CmsModelFieldInput = {
            id: mdbid(),
            fieldId: "field1",
            label: "Field 1",
            helpText: "help text",
            multipleValues: false,
            placeholderText: "placeholder text",
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "rendererName"
            },
            settings: {},
            type: "text",
            validation: [],
            listValidation: []
        };
        const [response] = await updateContentModelMutation({
            modelId: contentModel.modelId,
            data: {
                name: "new name",
                titleFieldId: "nonExistingTitleFieldId",
                fields: [field],
                layout: [[field.id]]
            }
        });

        expect(response).toEqual({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: `Field does not exist in the model.`,
                        data: {
                            fieldId: "nonExistingTitleFieldId"
                        }
                    }
                }
            }
        });
    });

    test("should execute hooks on create", async () => {
        const { createContentModelMutation } = useContentGqlHandler({
            ...manageHandlerOpts,
            plugins: [assignModelEvents()]
        });

        const [response] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                group: contentModelGroup.id
            }
        });

        expect(response).toEqual({
            data: {
                createContentModel: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeCreate")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterCreate")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeCreateFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterCreateFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterDelete")).toEqual(false);
    });

    test("should execute hooks on create from", async () => {
        const { createContentModelMutation, createContentModelFromMutation } = useContentGqlHandler(
            {
                ...manageHandlerOpts,
                plugins: [assignModelEvents()]
            }
        );

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                group: contentModelGroup.id
            }
        });
        const { modelId } = createResponse.data.createContentModel.data;
        // need to reset because hooks for create have been fired
        pubSubTracker.reset();

        const [response] = await createContentModelFromMutation({
            modelId,
            data: {
                name: "Cloned model",
                modelId: "clonedTestModel",
                description: "Cloned model description",
                group: contentModelGroup.id
            }
        });

        expect(response).toMatchObject({
            data: {
                createContentModelFrom: {
                    data: {
                        name: "Cloned model",
                        description: "Cloned model description",
                        modelId: "clonedTestModel",
                        group: {
                            id: contentModelGroup.id,
                            name: contentModelGroup.name
                        },
                        fields: [],
                        layout: [],
                        plugin: false
                    },
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentModel:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeCreateFrom")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterCreateFrom")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterDelete")).toEqual(false);
    });

    test("should execute hooks on update", async () => {
        const { createContentModelMutation, updateContentModelMutation } = useContentGqlHandler({
            ...manageHandlerOpts,
            plugins: [assignModelEvents()]
        });

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                group: contentModelGroup.id
            }
        });
        const { modelId } = createResponse.data.createContentModel.data;
        // need to reset because hooks for create have been fired
        pubSubTracker.reset();

        const [response] = await updateContentModelMutation({
            modelId,
            data: {
                name: "Updated content model",
                fields: [],
                layout: []
            }
        });

        expect(response).toEqual({
            data: {
                updateContentModel: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentModel:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeCreateFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterCreateFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeUpdate")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterUpdate")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeDelete")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterDelete")).toEqual(false);
    });

    test("should execute hooks on delete", async () => {
        const { createContentModelMutation, deleteContentModelMutation } = useContentGqlHandler({
            ...manageHandlerOpts,
            plugins: [assignModelEvents()]
        });

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                group: contentModelGroup.id
            }
        });
        const { modelId } = createResponse.data.createContentModel.data;
        // need to reset because hooks for create have been fired
        pubSubTracker.reset();

        const [response] = await deleteContentModelMutation({
            modelId
        });

        expect(response).toEqual({
            data: {
                deleteContentModel: {
                    data: true,
                    error: null
                }
            }
        });

        expect(pubSubTracker.isExecutedOnce("contentModel:beforeCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterCreate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeCreateFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterCreateFrom")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterUpdate")).toEqual(false);
        expect(pubSubTracker.isExecutedOnce("contentModel:beforeDelete")).toEqual(true);
        expect(pubSubTracker.isExecutedOnce("contentModel:afterDelete")).toEqual(true);
    });

    test("should refresh the schema when added new field", async () => {
        const { createContentModelMutation, updateContentModelMutation } =
            useContentGqlHandler(manageHandlerOpts);
        const { listBugs } = useBugManageHandler(manageHandlerOpts);

        const bugModel = models.find(m => m.modelId === "bug");
        if (!bugModel) {
            throw new Error("Could not find model `bug`.");
        }
        // Create initial record
        const [createBugModelResponse] = await createContentModelMutation({
            data: {
                name: bugModel.name,
                modelId: bugModel.modelId,
                group: contentModelGroup.id
            }
        });

        const removedFields: CmsModelField[] = [];

        const initialFields = Array.from(bugModel.fields);
        const initialLayouts = Array.from(bugModel.layout);

        removedFields.push(initialFields.pop() as CmsModelField);
        removedFields.push(initialFields.pop() as CmsModelField);

        initialLayouts.pop();
        initialLayouts.pop();

        await updateContentModelMutation({
            modelId: createBugModelResponse.data.createContentModel.data.modelId,
            data: {
                fields: initialFields,
                layout: initialLayouts
            }
        });

        const [listResponse] = await listBugs({
            where: {
                name: "test"
            },
            sort: ["createdOn_DESC"]
        });
        // should not be able to query bugType or bugValue fields (they are defined in the graphql query)
        expect(listResponse).toEqual({
            errors: [
                {
                    message: `Cannot query field "bugValue" on type "Bug". Did you mean "bugType"?`,
                    locations: expect.any(Array)
                },
                {
                    message: `Cannot query field "bugFixed" on type "Bug". Did you mean "bugType"?`,
                    locations: expect.any(Array)
                }
            ]
        });

        // update model with new field so it can regenerate the schema
        const [updateFieldsBugModelResponse] = await updateContentModelMutation({
            modelId: createBugModelResponse.data.createContentModel.data.modelId,
            data: {
                fields: initialFields.concat(removedFields),
                layout: initialLayouts.concat(removedFields.map(f => [f.id]))
            }
        });

        expect(updateFieldsBugModelResponse).toEqual({
            data: {
                updateContentModel: {
                    data: expect.any(Object),
                    error: null
                }
            }
        });

        // make sure that we can query newly added fields
        const [listResponseAfterUpdate] = await listBugs({
            where: {
                name: "test",
                bugType: "t1",
                bugValue: 3,
                bugFixed: 2
            },
            sort: ["createdOn_DESC"]
        });

        expect(listResponseAfterUpdate).toEqual({
            data: {
                listBugs: {
                    data: [],
                    meta: {
                        totalCount: 0,
                        hasMoreItems: false,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    test("should list only specific content models", async () => {
        const { createContentModelMutation } = useContentGqlHandler(manageHandlerOpts);

        const createdContentModels = [];

        for (let i = 0; i < 3; i++) {
            const [createResponse] = await createContentModelMutation({
                data: {
                    name: `Test Content model instance-${i}`,
                    modelId: `test-content-model-${i}`,
                    group: contentModelGroup.id
                }
            });
            createdContentModels.push(createResponse.data.createContentModel.data);
        }

        const { listContentModelsQuery: listModels } = useContentGqlHandler({
            ...manageHandlerOpts,
            permissions: createPermissions({ models: [createdContentModels[0].modelId] })
        });

        const [response] = await listModels();

        expect(response.data.listContentModels.data.length).toEqual(1);
    });

    test("error when getting model without specific group permission", async () => {
        const { createContentModelMutation } = useContentGqlHandler(manageHandlerOpts);

        const createdContentModels = [];

        for (let i = 0; i < 3; i++) {
            const [createResponse] = await createContentModelMutation({
                data: {
                    name: `Test Content model instance-${i}`,
                    modelId: `test-content-model-${i}`,
                    group: contentModelGroup.id
                }
            });
            createdContentModels.push(createResponse.data.createContentModel.data);
        }
        // Get model with group permissions
        const permissions = createPermissions({
            models: [createdContentModels[0].modelId],
            groups: ["some-group-id"]
        });
        const { getContentModelQuery: getModel } = useContentGqlHandler({
            ...manageHandlerOpts,
            permissions
        });
        // Should return an error while getting a model without required group permission.
        const [response] = await getModel({
            modelId: createdContentModels[0].modelId
        });

        expect(response.data.getContentModel.data).toEqual(null);
        expect(response.data.getContentModel.error).toEqual({
            code: "SECURITY_NOT_AUTHORIZED",
            data: { reason: 'Not allowed to access model "testContentModel0".' },
            message: "Not authorized!"
        });
    });

    test("should be able to get model with specific group permission", async () => {
        const { createContentModelMutation } = useContentGqlHandler(manageHandlerOpts);

        const createdContentModels = [];

        for (let i = 0; i < 3; i++) {
            const [createResponse] = await createContentModelMutation({
                data: {
                    name: `Test Content model instance-${i}`,
                    modelId: `test-content-model-${i}`,
                    group: contentModelGroup.id
                }
            });
            createdContentModels.push(createResponse.data.createContentModel.data);
        }

        // Get model with group permissions
        const permissions = createPermissions({
            models: [createdContentModels[0].modelId],
            groups: [contentModelGroup.id]
        });
        const { getContentModelQuery: getModelB } = useContentGqlHandler({
            ...manageHandlerOpts,
            permissions
        });
        // Should return an error while getting a model without required group permission.
        const [response] = await getModelB({
            modelId: createdContentModels[0].modelId
        });

        expect(response.data.getContentModel.data).toEqual({
            ...createdContentModels[0],
            description: null
        });
        expect(response.data.getContentModel.error).toEqual(null);
    });
});
