/* eslint-disable jest/no-commented-out-tests */
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
    createInitialAliasEnvironment,
    createInitialEnvironment,
    createTestContentModelGroupPk
} from "../utils/helpers";
import {
    CmsContentModelGroupType,
    CmsEnvironmentType,
    DbItemTypes
} from "@webiny/api-headless-cms/types";
import mdbid from "mdbid";

const getTypeFields = type => {
    return type.fields.filter(f => f.name !== "_empty").map(f => f.name);
};

const getTypeObject = (schema, type) => {
    return schema.types.find(t => t.name === type);
};

const createContentModelGroup = async (client: DocumentClient, environment: CmsEnvironmentType) => {
    const model: CmsContentModelGroupType = {
        id: mdbid(),
        name: "Group",
        slug: "group",
        icon: "ico/ico",
        createdBy: {
            id: "123",
            name: "name"
        },
        description: "description",
        environment,
        createdOn: new Date(),
        changedOn: null
    };
    await client
        .put({
            TableName: "HeadlessCms",
            Item: {
                PK: createTestContentModelGroupPk(),
                SK: model.id,
                TYPE: DbItemTypes.CMS_CONTENT_MODEL_GROUP,
                ...model
            }
        })
        .promise();
    return model;
};

describe("content model test", () => {
    const readHandlerOpts = { path: "read/production/en-US" };
    const manageHandlerOpts = { path: "manage/production/en-US" };

    const { documentClient } = useContentGqlHandler(manageHandlerOpts);

    let environment: CmsEnvironmentType;

    beforeEach(async () => {
        environment = await createInitialEnvironment(documentClient);
        await createInitialAliasEnvironment(documentClient, environment);
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
            updateContentModelMutation
        } = useContentGqlHandler(manageHandlerOpts);

        const contentModelGroup = await createContentModelGroup(documentClient, environment);

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
                        createdBy: {
                            id: "1234567890",
                            name: "userName123"
                        },
                        createdOn: /^20/,
                        changedOn: null
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

        // nothing is changed in this update
        const [updateResponse] = await updateContentModelMutation({
            id: createdContentModel.id,
            data: {}
        });

        expect(updateResponse).toEqual({
            data: {
                updateContentModel: {
                    data: createResponse.data.createContentModel.data,
                    error: null
                }
            }
        });

        // change some values in content model
        const [changedUpdateResponse] = await updateContentModelMutation({
            id: createdContentModel.id,
            data: {
                name: "changed name",
                description: "changed description"
            }
        });

        expect(changedUpdateResponse).toEqual({
            data: {
                updateContentModel: {
                    data: {
                        ...createdContentModel,
                        name: "changed name",
                        description: "changed description"
                    },
                    error: null
                }
            }
        });
    });

    // test("create, read, update, delete and list content model", async () => {
    //     // create
    //     const [response] = await createContentModelMutation({
    //         data: {
    //             name: "name"
    //         }
    //     });
    //     expect(response).toEqual({
    //         data: {
    //             cms: {
    //                 createContentModel: {
    //                     data: {
    //                         id: expect.any(String),
    //                         createdOn: expect.any(String),
    //                         changedOn: expect.any(String),
    //                         createdBy: {
    //                             id: "1234567890",
    //                             displayName: "userName123"
    //                         }
    //                     },
    //                     error: null
    //                 }
    //             }
    //         }
    //     });
    //
    //     const model = response.data.cms.createContentModel.data;
    //
    //     // get
    //     const [getResponse] = await getContentModelQuery({
    //         id: 1
    //     });
    //     expect(getResponse).toEqual({
    //         data: {
    //             cms: {
    //                 getContentModel: {
    //                     data: model,
    //                     error: null
    //                 }
    //             }
    //         }
    //     });
    //     // update
    //     const [updateResponse] = await updateContentModelMutation({
    //         id: model.id,
    //         data: {
    //             name: "updated",
    //             description: "updated description",
    //             group: "testStringThatShouldNotUpdate"
    //         }
    //     });
    //     expect(updateResponse).toEqual({
    //         data: {
    //             cms: {
    //                 updateContentModel: {
    //                     data: {
    //                         ...model,
    //                         name: "updated",
    //                         description: "updated description",
    //                         changedOn: /^20/
    //                     },
    //                     error: null
    //                 }
    //             }
    //         }
    //     });
    //
    //     const updatedModel = updateResponse.data.cms.updateContentModel.data;
    //
    //     // list
    //     const [listResponse] = await listContentModelsQuery();
    //     expect(listResponse.data.cms.listContentModels.data).toHaveLength(1);
    //     expect(listResponse).toEqual({
    //         data: {
    //             cms: {
    //                 listContentModels: {
    //                     data: [updatedModel],
    //                     error: null
    //                 }
    //             }
    //         }
    //     });
    //
    //     // delete
    //     const [deleteResponse] = await deleteContentModelMutation({
    //         id: updatedModel.id
    //     });
    //     expect(deleteResponse).toEqual({
    //         data: {
    //             cms: {
    //                 deleteContentModel: {
    //                     data: true,
    //                     error: null
    //                 }
    //             }
    //         }
    //     });
    //
    //     // list again
    //
    //     const [listAfterDeleteResponse] = await listContentModelsQuery();
    //
    //     expect(listAfterDeleteResponse.data.cms.listContentModels.data).toHaveLength(0);
    //     expect(listAfterDeleteResponse).toEqual({
    //         data: {
    //             cms: {
    //                 listContentModels: {
    //                     data: [],
    //                     error: null
    //                 }
    //             }
    //         }
    //     });
    // });

    // const createModelDataList: any = [
    //     [
    //         {
    //             name: "model",
    //             code: "model",
    //             description: "description"
    //         },
    //         "group"
    //     ],
    //     [
    //         {
    //             group: "group",
    //             code: "model",
    //             description: "description"
    //         },
    //         "name"
    //     ],
    //     [
    //         {
    //             name: "model",
    //             group: "group",
    //             description: "description"
    //         },
    //         "code"
    //     ]
    // ];
    //
    // test.each(createModelDataList)(
    //     "test create model error when missing %s",
    //     async (data, field) => {
    //         const [response] = await createContentModelMutation({
    //             data
    //         });
    //
    //         expect(response).toEqual({
    //             data: {
    //                 cms: {
    //                     createContentModel: {
    //                         data: null,
    //                         error: {
    //                             message: `missing data ${field}`,
    //                             code: "CREATE_CONTENT_MODEL_FAILED"
    //                         }
    //                     }
    //                 }
    //             }
    //         });
    //     }
    // );
    //
    // test("error when getting non-existing model", async () => {
    //     const id = "nonExistingId";
    //     const [response] = await getContentModelQuery({
    //         id
    //     });
    //
    //     expect(response).toEqual({
    //         data: {
    //             cms: {
    //                 contentModelQuery: {
    //                     data: null,
    //                     error: {
    //                         message: `CMS Content model "${id}" not found.`,
    //                         code: "NOT_FOUND"
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // });
    //
    // test("error when updating non-existing model", async () => {
    //     const id = "nonExistingId";
    //     const [response] = await updateContentModelMutation({
    //         id,
    //         data: {
    //             name: "new name"
    //         }
    //     });
    //
    //     expect(response).toEqual({
    //         data: {
    //             cms: {
    //                 updateContentModel: {
    //                     data: null,
    //                     error: {
    //                         message: `CMS Content model "${id}" not found.`,
    //                         code: "NOT_FOUND"
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // });
    //
    // test("error when deleting non-existing model", async () => {
    //     const id = "nonExistingId";
    //     const [response] = await deleteContentModelMutation({
    //         id
    //     });
    //
    //     expect(response).toEqual({
    //         data: {
    //             cms: {
    //                 deleteContentModel: {
    //                     data: null,
    //                     error: {
    //                         message: `CMS Content model "${id}" not found.`,
    //                         code: "NOT_FOUND"
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // });
});
