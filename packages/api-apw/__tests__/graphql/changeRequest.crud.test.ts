import { useContentGqlHandler } from "../utils/useContentGqlHandler";

const richTextMock = [
    {
        tag: "h1",
        content: "Testing H1 tags"
    },
    {
        tag: "p",
        content: "Some small piece of text to test P tags"
    },
    {
        tag: "div",
        content: [
            {
                tag: "p",
                text: "Text inside the div > p"
            },
            {
                tag: "a",
                href: "https://www.webiny.com",
                text: "Webiny"
            }
        ]
    }
];

const updatedRichText = [
    {
        tag: "h1",
        content: "Testing H1 tags - Updated"
    },
    {
        tag: "p",
        content: "Some small piece of text to test P tags - Updated"
    },
    {
        tag: "div",
        content: [
            {
                tag: "p",
                text: "Text inside the div > p"
            },
            {
                tag: "a",
                href: "https://www.webiny.com",
                text: "Webiny"
            }
        ]
    }
];

const changeRequested = {
    step: "61af1a60f04e49226e6cc17e#design_review",
    title: "Please replace this heading",
    body: richTextMock,
    media: {
        src: "cloudfront.net/my-file"
    }
};

describe("ChangeRequest crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        getChangeRequestQuery,
        listChangeRequestsQuery,
        createChangeRequestMutation,
        updateChangeRequestMutation,
        deleteChangeRequestMutation
    } = useContentGqlHandler({
        ...options
    });
    test("should able to create, update, get, list and delete a comment", async () => {
        /*
         * Should return error in case of no entry found.
         */
        const [getChangeRequestResponse] = await getChangeRequestQuery({ id: "123" });
        expect(getChangeRequestResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getChangeRequest: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "Entry not found!"
                        }
                    }
                }
            }
        });
        /*
         * Create a new entry.
         */
        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequested
        });
        const { id } =
            createChangeRequestResponse.data.advancedPublishingWorkflow.createChangeRequest.data;

        expect(createChangeRequestResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    createChangeRequest: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            resolved: null,
                            ...changeRequested
                        },
                        error: null
                    }
                }
            }
        });
        /**
         *  Now that we have a entry, we should be able to get it.
         */
        const [getChangeRequestByIdResponse] = await getChangeRequestQuery({ id: id });
        expect(getChangeRequestByIdResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getChangeRequest: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            resolved: null,
                            ...changeRequested
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Let's update the entry.
         */
        const [updateChangeRequestResponse] = await updateChangeRequestMutation({
            id,
            data: {
                body: updatedRichText,
                resolved: true
            }
        });
        expect(updateChangeRequestResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    updateChangeRequest: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            ...changeRequested,
                            resolved: true,
                            body: updatedRichText
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Let's list all entries should return only one.
         */
        const [listChangeRequestsResponse] = await listChangeRequestsQuery({ where: {} });
        expect(listChangeRequestsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangeRequests: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                ...changeRequested,
                                resolved: true,
                                body: updatedRichText
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: null
                        }
                    }
                }
            }
        });

        /**
         *  Delete the only entry we have.
         */
        const [deleteChangeRequestResponse] = await deleteChangeRequestMutation({ id });
        expect(deleteChangeRequestResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    deleteChangeRequest: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Now that we've deleted the only entry we had, we should get empty list as response.
         */
        const [listChangeRequestsAgainResponse] = await listChangeRequestsQuery({ where: {} });
        expect(listChangeRequestsAgainResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangeRequests: {
                        data: [],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 0,
                            cursor: null
                        }
                    }
                }
            }
        });
    });
});
