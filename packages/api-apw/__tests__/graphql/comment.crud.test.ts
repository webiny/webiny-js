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

describe("Comment crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        getCommentQuery,
        listCommentsQuery,
        createCommentMutation,
        updateCommentMutation,
        deleteCommentMutation
    } = useContentGqlHandler({
        ...options
    });
    test("should able to create, update, get, list and delete a comment", async () => {
        /*
         * Should return error in case of no entry found.
         */
        const [getCommentResponse] = await getCommentQuery({ id: "123" });
        expect(getCommentResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getComment: {
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
         * Create a new workflow entry.
         */
        const [createCommentResponse] = await createCommentMutation({
            data: {
                body: richTextMock
            }
        });
        const { id } = createCommentResponse.data.advancedPublishingWorkflow.createComment.data;

        expect(createCommentResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    createComment: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            body: richTextMock
                        },
                        error: null
                    }
                }
            }
        });
        /**
         *  Now that we have a workflow entry, we should be able to get it.
         */
        const [getCommentByIdResponse] = await getCommentQuery({ id: id });
        expect(getCommentByIdResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getComment: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            body: richTextMock
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Let's update the entry.
         */
        const [updateCommentResponse] = await updateCommentMutation({
            id,
            data: {
                body: updatedRichText
            }
        });
        expect(updateCommentResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    updateComment: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            body: updatedRichText
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Let's list all workflow entries should return only one.
         */
        const [listCommentsResponse] = await listCommentsQuery({ where: {} });
        expect(listCommentsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listComments: {
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
         *  Delete the only workflow entry we have.
         */
        const [deleteCommentResponse] = await deleteCommentMutation({ id });
        expect(deleteCommentResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    deleteComment: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Now that we've deleted the only entry we had, we should get empty list as response from "listComments".
         */
        const [listCommentsAgainResponse] = await listCommentsQuery({ where: {} });
        expect(listCommentsAgainResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listComments: {
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
