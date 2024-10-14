import { CmsGroup, CmsModel, CmsModelField, CmsModelFieldInput } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import * as helpers from "../testHelpers/helpers";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler";
import { assignModelEvents, pubSubTracker } from "./mocks/lifecycleHooks";
import { useBugManageHandler } from "../testHelpers/useBugManageHandler";

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

describe("content model test", () => {
    const readHandlerOpts = { path: "read/en-US" };
    const manageHandlerOpts = { path: "manage/en-US" };

    const {
        createContentModelGroupMutation,
        createContentModelMutation: baseCreateContentModelMutation
    } = useGraphQLHandler(manageHandlerOpts);

    let contentModelGroup: CmsGroup;

    beforeEach(async () => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                },
                description: "description"
            }
        });
        contentModelGroup = createCMG.data.createContentModelGroup.data;
        // we need to reset this since we are using a singleton
        pubSubTracker.reset();
    });

    test("base schema should only contain relevant queries and mutations", async () => {
        // create a "read" and "manage" endpoints
        const readAPI = useGraphQLHandler(readHandlerOpts);
        const manageAPI = useGraphQLHandler(manageHandlerOpts);

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
            "exportStructure",
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
            "validateImportStructure",
            "importStructure",
            "createContentModel",
            "createContentModelFrom",
            "updateContentModel",
            "deleteContentModel",
            "initializeModel",
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
        } = useGraphQLHandler(manageHandlerOpts);

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels",
                group: contentModelGroup.id,
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                }
            }
        });

        expect(createResponse).toEqual({
            data: {
                createContentModel: {
                    data: {
                        name: "Test Content model",
                        description: "",
                        titleFieldId: "id",
                        descriptionFieldId: null,
                        imageFieldId: null,
                        modelId: "testContentModel",
                        singularApiName: "TestContentModel",
                        pluralApiName: "TestContentModels",
                        createdBy: helpers.identity,
                        createdOn: expect.stringMatching(/^20/),
                        savedOn: expect.stringMatching(/^20/),
                        fields: [],
                        layout: [],
                        plugin: false,
                        group: {
                            id: contentModelGroup.id,
                            name: contentModelGroup.name,
                            slug: contentModelGroup.slug
                        },
                        icon: {
                            type: "emoji",
                            name: "thumbs_up",
                            value: "👍"
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
                layout: [],
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                }
            }
        });

        const updatedContentModel = {
            ...createdContentModel,
            name: "changed name",
            description: "changed description",
            savedOn: expect.stringMatching(/^20/),
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            }
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
            useGraphQLHandler(manageHandlerOpts);

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels",
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
        } = useGraphQLHandler(manageHandlerOpts);
        const { createCategory } = useCategoryManageHandler(manageHandlerOpts);
        const category = models.find(m => m.modelId === "category");
        if (!category) {
            throw new Error("Could not find model `category`.");
        }

        // Create initial record
        const [createContentModelResponse] = await createContentModelMutation({
            data: {
                name: category.name,
                modelId: category.modelId,
                singularApiName: category.singularApiName,
                pluralApiName: category.pluralApiName,
                group: contentModelGroup.id
            }
        });

        expect(createContentModelResponse).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        modelId: category.modelId
                    },
                    error: null
                }
            }
        });

        const [updateContentModelResponse] = await updateContentModelMutation({
            modelId: createContentModelResponse.data.createContentModel.data.modelId,
            data: {
                fields: category.fields,
                layout: category.layout
            }
        });

        expect(updateContentModelResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        modelId: category.modelId
                    },
                    error: null
                }
            }
        });

        const model = updateContentModelResponse.data.updateContentModel.data;

        const [createCategoryResponse] = await createCategory({
            data: {
                title: "Category",
                slug: "title"
            }
        });
        expect(createCategoryResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        id: expect.any(String)
                    },
                    error: null
                }
            }
        });

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
            useGraphQLHandler(manageHandlerOpts);

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels",
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
        const { getContentModelQuery } = useGraphQLHandler(manageHandlerOpts);
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
        const { updateContentModelMutation } = useGraphQLHandler(manageHandlerOpts);
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
        const { deleteContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

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
            useGraphQLHandler(manageHandlerOpts);
        const modelData: Pick<CmsModel, "name" | "modelId" | "singularApiName" | "pluralApiName"> =
            {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels"
            };
        const realModelId = "testContentModel";
        const [createResponse] = await createContentModelMutation({
            data: {
                ...modelData,
                modelId: realModelId,
                group: contentModelGroup.id
            }
        });

        expect(createResponse).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        ...modelData,
                        modelId: realModelId
                    },
                    error: null
                }
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const textField: CmsModelFieldInput = {
            id: "someRandomTextFieldId",
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
            id: "someRandomNumberFieldId",
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
                        ...modelData,
                        savedOn: expect.stringMatching(/^20/),
                        createdBy: helpers.identity,
                        createdOn: expect.stringMatching(/^20/),
                        description: null,
                        titleFieldId: textField.fieldId,
                        descriptionFieldId: null,
                        imageFieldId: null,
                        fields: [
                            {
                                ...textField,
                                storageId: `${textField.type}@${textField.id}`
                            },
                            {
                                ...numberField,
                                storageId: `${numberField.type}@${numberField.id}`
                            }
                        ],
                        group: {
                            id: contentModelGroup.id,
                            name: "Group",
                            slug: contentModelGroup.slug
                        },
                        modelId: contentModel.modelId,
                        layout: [[textField.id], [numberField.id]],
                        name: "new name",
                        plugin: false,
                        icon: null
                    },
                    error: null
                }
            }
        });
    });

    test("error when assigning titleFieldId on non existing field", async () => {
        const { createContentModelMutation, updateContentModelMutation } =
            useGraphQLHandler(manageHandlerOpts);
        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels",
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const field: CmsModelFieldInput = {
            id: "someRandomField1Id",
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

        expect(response).toMatchObject({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: `Field selected for the title field does not exist in the model.`,
                        data: {
                            fieldId: "nonExistingTitleFieldId",
                            fields: expect.any(Array)
                        }
                    }
                }
            }
        });
    });

    test("should execute hooks on create", async () => {
        const { createContentModelMutation } = useGraphQLHandler({
            ...manageHandlerOpts,
            plugins: [assignModelEvents()]
        });

        const [response] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels",
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
        const { createContentModelMutation, createContentModelFromMutation } = useGraphQLHandler({
            ...manageHandlerOpts,
            plugins: [assignModelEvents()]
        });

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels",
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
                singularApiName: "ClonedTestModel",
                pluralApiName: "ClonedTestModels",
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
        const { createContentModelMutation, updateContentModelMutation } = useGraphQLHandler({
            ...manageHandlerOpts,
            plugins: [assignModelEvents()]
        });

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels",
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
        const { createContentModelMutation, deleteContentModelMutation } = useGraphQLHandler({
            ...manageHandlerOpts,
            plugins: [assignModelEvents()]
        });

        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: "TestContentModel",
                pluralApiName: "TestContentModels",
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
            useGraphQLHandler(manageHandlerOpts);
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
                singularApiName: bugModel.singularApiName,
                pluralApiName: bugModel.pluralApiName,
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
                    message: `Cannot query field "bugValue" on type "${bugModel.singularApiName}". Did you mean "bugType"?`,
                    locations: expect.any(Array)
                },
                {
                    message: `Cannot query field "bugFixed" on type "${bugModel.singularApiName}". Did you mean "bugType"?`,
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
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        const createdContentModels = [];

        for (let i = 0; i < 3; i++) {
            const [createResponse] = await createContentModelMutation({
                data: {
                    name: `Test Content model instance-${i}`,
                    modelId: `test-content-model-${i}`,
                    singularApiName: `TestContentModel${i}`,
                    pluralApiName: `TestContentModels${i}`,
                    group: contentModelGroup.id
                }
            });
            createdContentModels.push(createResponse.data.createContentModel.data);
        }

        const { listContentModelsQuery: listModels } = useGraphQLHandler({
            ...manageHandlerOpts,
            identity: {
                ...helpers.identity,
                id: "identityWithSpecificModelPermissions"
            },
            permissions: createPermissions({ models: [createdContentModels[0].modelId] })
        });

        const [response] = await listModels();

        expect(response.data.listContentModels.data.length).toEqual(1);
    });

    test("error when getting model without specific group permission", async () => {
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        const createdContentModels = [];

        for (let i = 0; i < 3; i++) {
            const [createResponse] = await createContentModelMutation({
                data: {
                    name: `Test Content model instance-${i}`,
                    modelId: `test-content-model-${i}`,
                    singularApiName: `TestContentModel${i}`,
                    pluralApiName: `TestContentModels${i}`,
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
        const { getContentModelQuery: getModel } = useGraphQLHandler({
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
        const { createContentModelMutation } = useGraphQLHandler(manageHandlerOpts);

        const createdContentModels = [];

        for (let i = 0; i < 3; i++) {
            const [createResponse] = await createContentModelMutation({
                data: {
                    name: `Test Content model instance-${i}`,
                    modelId: `test-content-model-${i}`,
                    singularApiName: `TestContentModel${i}`,
                    pluralApiName: `TestContentModels${i}`,
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
        const { getContentModelQuery: getModelB } = useGraphQLHandler({
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

    it("should allow to update a model with description set to null", async () => {
        const { createContentModelMutation, updateContentModelMutation } =
            useGraphQLHandler(manageHandlerOpts);

        const model = {
            name: `Test Content model instance`,
            modelId: `testContentModel`,
            singularApiName: `TestContentModel`,
            pluralApiName: `TestContentModels`
        };
        const [createResponse] = await createContentModelMutation({
            data: {
                ...model,
                group: contentModelGroup.id
            }
        });
        expect(createResponse).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        ...model,
                        description: ""
                    },
                    error: null
                }
            }
        });

        const [updateNoDescriptionResponse] = await updateContentModelMutation({
            modelId: model.modelId,
            data: {
                name: "Updated",
                fields: [],
                layout: []
            }
        });
        expect(updateNoDescriptionResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        name: "Updated",
                        modelId: model.modelId,
                        description: null
                    },
                    error: null
                }
            }
        });
        const [updateNullDescriptionResponse] = await updateContentModelMutation({
            modelId: model.modelId,
            data: {
                name: "Updated",
                fields: [],
                layout: [],
                description: null
            }
        });
        expect(updateNullDescriptionResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        name: "Updated",
                        modelId: model.modelId,
                        description: null
                    },
                    error: null
                }
            }
        });
        const [updateEmptyDescriptionResponse] = await updateContentModelMutation({
            modelId: model.modelId,
            data: {
                name: "Updated",
                fields: [],
                layout: [],
                description: ""
            }
        });
        expect(updateEmptyDescriptionResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        name: "Updated",
                        modelId: model.modelId,
                        description: null
                    },
                    error: null
                }
            }
        });
    });

    it("should assign description field", async () => {
        const { createContentModelMutation, getContentModelQuery, updateContentModelMutation } =
            useGraphQLHandler(manageHandlerOpts);
        const field = {
            id: "testId",
            fieldId: "testFieldId",
            type: "long-text",
            label: "Test Field"
        };

        const [createResponseWithInitialLongText] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: `TestContentModel`,
                pluralApiName: `TestContentModels`,
                group: contentModelGroup.id,
                fields: [field],
                layout: [["testId"]]
            }
        });

        expect(createResponseWithInitialLongText).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        modelId: "testContentModel",
                        fields: [field],
                        descriptionFieldId: "testFieldId"
                    },
                    error: null
                }
            }
        });

        const [responseAfterCreate] = await getContentModelQuery({
            modelId: "testContentModel"
        });
        expect(responseAfterCreate).toMatchObject({
            data: {
                getContentModel: {
                    data: {
                        modelId: "testContentModel",
                        fields: [field],
                        descriptionFieldId: field.fieldId
                    },
                    error: null
                }
            }
        });

        const [createResponseWithNoFields] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model-2",
                singularApiName: `TestContentModel2`,
                pluralApiName: `TestContentModels2`,
                group: contentModelGroup.id,
                fields: [],
                layout: []
            }
        });
        expect(createResponseWithNoFields).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        modelId: "testContentModel2",
                        fields: [],
                        descriptionFieldId: null
                    },
                    error: null
                }
            }
        });

        const [updateResponseWithFields] = await updateContentModelMutation({
            modelId: "testContentModel2",
            data: {
                fields: [field],
                layout: [[field.id]]
            }
        });
        expect(updateResponseWithFields).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        modelId: "testContentModel2",
                        fields: [field],
                        descriptionFieldId: field.fieldId
                    },
                    error: null
                }
            }
        });

        const [responseAfterUpdate] = await getContentModelQuery({
            modelId: "testContentModel2"
        });
        expect(responseAfterUpdate).toMatchObject({
            data: {
                getContentModel: {
                    data: {
                        modelId: "testContentModel2",
                        fields: [field],
                        descriptionFieldId: field.fieldId
                    },
                    error: null
                }
            }
        });
    });

    it("should assign image field", async () => {
        const { createContentModelMutation, getContentModelQuery, updateContentModelMutation } =
            useGraphQLHandler(manageHandlerOpts);
        const field = {
            id: "testId",
            fieldId: "testFieldId",
            type: "file",
            label: "Test Field",
            settings: {
                imagesOnly: true
            }
        };

        const [createResponseWithInitialFile] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model",
                singularApiName: `TestContentModel`,
                pluralApiName: `TestContentModels`,
                group: contentModelGroup.id,
                fields: [field],
                layout: [["testId"]]
            }
        });

        expect(createResponseWithInitialFile).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        modelId: "testContentModel",
                        fields: [field],
                        imageFieldId: "testFieldId"
                    },
                    error: null
                }
            }
        });

        const [responseAfterCreate] = await getContentModelQuery({
            modelId: "testContentModel"
        });
        expect(responseAfterCreate).toMatchObject({
            data: {
                getContentModel: {
                    data: {
                        modelId: "testContentModel",
                        fields: [field],
                        imageFieldId: field.fieldId
                    },
                    error: null
                }
            }
        });

        const [createResponseWithNoFields] = await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model-2",
                singularApiName: `TestContentModel2`,
                pluralApiName: `TestContentModels2`,
                group: contentModelGroup.id,
                fields: [],
                layout: []
            }
        });
        expect(createResponseWithNoFields).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        modelId: "testContentModel2",
                        fields: [],
                        imageFieldId: null
                    },
                    error: null
                }
            }
        });

        const [updateResponseWithFields] = await updateContentModelMutation({
            modelId: "testContentModel2",
            data: {
                fields: [field],
                layout: [[field.id]]
            }
        });
        expect(updateResponseWithFields).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        modelId: "testContentModel2",
                        fields: [field],
                        imageFieldId: field.fieldId
                    },
                    error: null
                }
            }
        });

        const [responseAfterUpdate] = await getContentModelQuery({
            modelId: "testContentModel2"
        });
        expect(responseAfterUpdate).toMatchObject({
            data: {
                getContentModel: {
                    data: {
                        modelId: "testContentModel2",
                        fields: [field],
                        imageFieldId: field.fieldId
                    },
                    error: null
                }
            }
        });
    });

    it("should create a model in a group with custom ID", async () => {
        await createContentModelGroupMutation({
            data: {
                id: "a-custom-group-id",
                name: "My Group With ID",
                description: "A group with ID",
                icon: {
                    type: "emoji",
                    name: "thumbs_up",
                    value: "👍"
                }
            }
        });

        const [response] = await baseCreateContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "test-content-model-2",
                singularApiName: `TestContentModel2`,
                pluralApiName: `TestContentModels2`,
                group: "a-custom-group-id",
                fields: [],
                layout: []
            }
        });
        expect(response).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        modelId: "testContentModel2",
                        group: {
                            id: "a-custom-group-id",
                            name: "My Group With ID"
                        }
                    },
                    error: null
                }
            }
        });
    });
});
