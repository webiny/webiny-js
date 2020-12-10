import { useContentGqlHandler } from "../../useContentGqlHandler";

describe("dynamic content model test", () => {
    const {
        getContentModelQuery,
        createContentModelMutation,
        updateContentModelMutation,
        listContentModelsQuery,
        deleteContentModelMutation
    } = useContentGqlHandler();

    test("create, read, update, delete and list content model", async () => {
        // create
        const [response] = await createContentModelMutation({
            data: {}
        });
        expect(response).toEqual({
            data: {
                cms: {
                    createContentModel: {
                        data: {},
                        error: null
                    }
                }
            }
        });

        const model = response.data.cms.createContentModel.data;

        // get
        const [getResponse] = await getContentModelQuery({
            id: 1
        });
        console.log(getResponse);
        expect(getResponse).toEqual({
            data: {
                cms: {
                    getContentModel: {
                        data: model,
                        error: null
                    }
                }
            }
        });
        // update
        const [updateResponse] = await updateContentModelMutation({
            id: model.id,
            data: {
                name: "updated",
                description: "updated description",
                group: "testStringThatShouldNotUpdate"
            }
        });
        expect(updateResponse).toEqual({
            data: {
                cms: {
                    updateContentModel: {
                        data: {
                            ...model,
                            name: "updated",
                            description: "updated description",
                            changedOn: /^20/
                        },
                        error: null
                    }
                }
            }
        });

        const updatedModel = updateResponse.data.cms.updateContentModel.data;

        // list
        const [listResponse] = await listContentModelsQuery();
        expect(listResponse.data.cms.listContentModels.data).toHaveLength(1);
        expect(listResponse).toEqual({
            data: {
                cms: {
                    listContentModels: {
                        data: [updatedModel],
                        error: null
                    }
                }
            }
        });

        // delete
        const [deleteResponse] = await deleteContentModelMutation({
            id: updatedModel.id
        });
        expect(deleteResponse).toEqual({
            data: {
                cms: {
                    deleteContentModel: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // list again

        const [listAfterDeleteResponse] = await listContentModelsQuery();

        expect(listAfterDeleteResponse.data.cms.listContentModels.data).toHaveLength(0);
        expect(listAfterDeleteResponse).toEqual({
            data: {
                cms: {
                    listContentModels: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });

    const createModelDataList: any = [
        [
            {
                name: "model",
                code: "model",
                description: "description"
            },
            "group"
        ],
        [
            {
                group: "group",
                code: "model",
                description: "description"
            },
            "name"
        ],
        [
            {
                name: "model",
                group: "group",
                description: "description"
            },
            "code"
        ]
    ];

    test.each(createModelDataList)(
        "test create model error when missing %s",
        async (data, field) => {
            const [response] = await createContentModelMutation({
                data
            });

            expect(response).toEqual({
                data: {
                    cms: {
                        createContentModel: {
                            data: null,
                            error: {
                                message: `missing data ${field}`,
                                code: "CREATE_CONTENT_MODEL_FAILED"
                            }
                        }
                    }
                }
            });
        }
    );

    test("error when getting non-existing model", async () => {
        const id = "nonExistingId";
        const [response] = await getContentModelQuery({
            id
        });

        expect(response).toEqual({
            data: {
                cms: {
                    contentModelQuery: {
                        data: null,
                        error: {
                            message: `CMS Content model "${id}" not found.`,
                            code: "NOT_FOUND"
                        }
                    }
                }
            }
        });
    });

    test("error when updating non-existing model", async () => {
        const id = "nonExistingId";
        const [response] = await updateContentModelMutation({
            id,
            data: {
                name: "new name"
            }
        });

        expect(response).toEqual({
            data: {
                cms: {
                    updateContentModel: {
                        data: null,
                        error: {
                            message: `CMS Content model "${id}" not found.`,
                            code: "NOT_FOUND"
                        }
                    }
                }
            }
        });
    });

    test("error when deleting non-existing model", async () => {
        const id = "nonExistingId";
        const [response] = await deleteContentModelMutation({
            id
        });

        expect(response).toEqual({
            data: {
                cms: {
                    deleteContentModel: {
                        data: null,
                        error: {
                            message: `CMS Content model "${id}" not found.`,
                            code: "NOT_FOUND"
                        }
                    }
                }
            }
        });
    });
});
