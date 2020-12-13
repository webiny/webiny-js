import { useContentGqlHandler } from "../../useContentGqlHandler";
import { createInitialAliasEnvironment, createInitialEnvironment } from "../../helpers";

const getTypeFields = type => {
    return type.fields.filter(f => f.name !== "_empty").map(f => f.name);
};

const getTypeObject = (schema, type) => {
    return schema.types.find(t => t.name === type);
};

describe("content model test", () => {
    const { documentClient } = useContentGqlHandler({
        pathParameters: { key: "manage/production/en-us" }
    });

    beforeEach(async () => {
        const env = await createInitialEnvironment(documentClient);
        await createInitialAliasEnvironment(documentClient, env);
    });

    test("base schema should only contain relevant queries and mutations", async () => {
        // create a "read" and "manage" endpoints
        const readAPI = useContentGqlHandler({ pathParameters: { key: "read/production/en-us" } });
        const manageAPI = useContentGqlHandler({
            pathParameters: { key: "manage/production/en-us" }
        });

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
