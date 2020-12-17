import {
    CmsContentModelFieldInputType,
    CmsContentModelGroupType,
    CmsEnvironmentType
} from "@webiny/api-headless-cms/types";
import mdbid from "mdbid";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import * as helpers from "../utils/helpers";

const getTypeFields = type => {
    return type.fields.filter(f => f.name !== "_empty").map(f => f.name);
};

const getTypeObject = (schema, type) => {
    return schema.types.find(t => t.name === type);
};

jest.setTimeout(15000);

describe("content model test", () => {
    const readHandlerOpts = { path: "read/production/en-US" };
    const manageHandlerOpts = { path: "manage/production/en-US" };

    const { documentClient } = useContentGqlHandler(manageHandlerOpts);

    let environment: CmsEnvironmentType;
    let contentModelGroup: CmsContentModelGroupType;

    beforeEach(async () => {
        environment = await helpers.createInitialEnvironment(documentClient);
        await helpers.createInitialAliasEnvironment(documentClient, environment);
        contentModelGroup = await helpers.createContentModelGroup(documentClient, environment);
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
            "getContentModelGroup",
            "listContentModelGroups"
        ]);
        expect(getTypeFields(ReadMutation)).toEqual([]);
        expect(getTypeFields(ManageMutation)).toEqual([
            "createContentModel",
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
                name: "Content model",
                modelId: "content-model",
                group: contentModelGroup.id
            }
        });

        expect(createResponse).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        id: /^([a-zA-Z0-9]+)$/,
                        createdBy: helpers.identity,
                        createdOn: /^20/,
                        savedOn: /^20/
                    },
                    error: null
                }
            }
        });
        const createdContentModel = createResponse.data.createContentModel.data;

        const [getResponse] = await getContentModelQuery({
            id: createdContentModel.id
        });

        expect(getResponse).toEqual({
            data: {
                getContentModel: {
                    data: createResponse.data.createContentModel.data,
                    error: null
                }
            }
        });

        // nothing is changed in this update - just the date
        const [updateResponse] = await updateContentModelMutation({
            id: createdContentModel.id,
            data: {
                fields: [],
                layout: []
            }
        });

        expect(updateResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        ...createResponse.data.createContentModel.data,
                        savedOn: /^20/
                    },
                    error: null
                }
            }
        });

        // change some values in content model
        const [changedUpdateResponse] = await updateContentModelMutation({
            id: createdContentModel.id,
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
            savedOn: /^20/
        };

        expect(changedUpdateResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: updatedContentModel,
                    error: null
                }
            }
        });

        const [listResponse] = await listContentModelsQuery();

        expect(listResponse.data.listContentModels.data).toHaveLength(1);
        expect(listResponse).toMatchObject({
            data: {
                listContentModels: {
                    data: [updatedContentModel],
                    error: null
                }
            }
        });

        const [deleteResponse] = await deleteContentModelMutation({
            id: updatedContentModel.id
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

    test("error when getting non-existing model", async () => {
        const { getContentModelQuery } = useContentGqlHandler(manageHandlerOpts);
        const id = "nonExistingId";
        const [response] = await getContentModelQuery({
            id
        });

        expect(response).toEqual({
            data: {
                getContentModel: {
                    data: null,
                    error: {
                        message: `CMS Content model "${id}" not found.`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    test("error when updating non-existing model", async () => {
        const { updateContentModelMutation } = useContentGqlHandler(manageHandlerOpts);
        const id = "nonExistingId";
        const [response] = await updateContentModelMutation({
            id,
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
                        message: `CMS Content model "${id}" not found.`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    test("error when deleting non-existing model", async () => {
        const { deleteContentModelMutation } = useContentGqlHandler(manageHandlerOpts);

        const id = "nonExistingId";
        const [response] = await deleteContentModelMutation({
            id
        });

        expect(response).toEqual({
            data: {
                deleteContentModel: {
                    data: null,
                    error: {
                        message: `CMS Content model "${id}" not found.`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    test("update content model with new field", async () => {
        const { createContentModelMutation, updateContentModelMutation } = useContentGqlHandler(
            manageHandlerOpts
        );
        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Content model",
                modelId: "content-model",
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const field: CmsContentModelFieldInputType = {
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
            validation: []
        };
        const [response] = await updateContentModelMutation({
            id: contentModel.id,
            data: {
                name: "new name",
                fields: [field],
                layout: [[field.id]]
            }
        });

        expect(response).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        savedOn: /^20/,
                        createdBy: helpers.identity,
                        createdOn: /^20/,
                        description: null,
                        titleFieldId: "field1",
                        fields: [
                            {
                                fieldId: "field1",
                                helpText: "help text",
                                id: field.id,
                                label: "Field 1",
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
                                validation: []
                            }
                        ],
                        group: {
                            id: contentModelGroup.id,
                            name: "Group"
                        },
                        id: contentModel.id,
                        layout: [[field.id]],
                        name: "new name"
                    },
                    error: null
                }
            }
        });
    });

    test("error when assigning titleFieldId on non existing field", async () => {
        const { createContentModelMutation, updateContentModelMutation } = useContentGqlHandler(
            manageHandlerOpts
        );
        const [createResponse] = await createContentModelMutation({
            data: {
                name: "Content model",
                modelId: "content-model",
                group: contentModelGroup.id
            }
        });

        const contentModel = createResponse.data.createContentModel.data;

        const field: CmsContentModelFieldInputType = {
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
            validation: []
        };
        const [response] = await updateContentModelMutation({
            id: contentModel.id,
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
                        code: "UPDATE_CONTENT_MODEL_FAILED",
                        message: `There is no field "nonExistingTitleFieldId" in the current fields, please check.`,
                        data: null
                    }
                }
            }
        });
    });
});
