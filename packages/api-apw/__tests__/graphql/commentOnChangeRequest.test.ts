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
const CHANGE_REQUESTED_MOCK = {
    title: "Please replace this heading",
    body: richTextMock,
    media: {
        src: "cloudfront.net/my-file"
    }
};

describe("Comment on a change request test", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        createChangeRequestedMutation,
        createCommentMutation,
        listCommentsQuery,
        deleteChangeRequestedMutation
    } = useContentGqlHandler({
        ...options
    });
    test("should able to comment on a change request", async () => {
        /*
         * Create a new change request entry.
         */
        const [createChangeRequestedResponse] = await createChangeRequestedMutation({
            data: CHANGE_REQUESTED_MOCK
        });
        const changeRequested =
            createChangeRequestedResponse.data.advancedPublishingWorkflow.createChangeRequested
                .data;

        /**
         * Add a comment to this change request.
         */
        const [createCommentResponse] = await createCommentMutation({
            data: {
                body: richTextMock,
                changeRequest: {
                    id: changeRequested.id
                }
            }
        });
        const firstComment =
            createCommentResponse.data.advancedPublishingWorkflow.createComment.data;
        expect(createCommentResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    createComment: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: expect.any(String),
                                displayName: expect.any(String),
                                type: "admin"
                            },
                            body: richTextMock,
                            changeRequest: {
                                id: changeRequested.id,
                                entryId: expect.any(String),
                                modelId: expect.any(String)
                            }
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * List all comments for a given change request.
         */
        const [listCommentsResponse] = await listCommentsQuery({
            where: {
                changeRequest: {
                    id: changeRequested.id
                }
            }
        });
        expect(listCommentsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listComments: {
                        data: [
                            {
                                id: firstComment.id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: {
                                    id: changeRequested.id,
                                    entryId: expect.any(String),
                                    modelId: expect.any(String)
                                }
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
         * Add another comment to the change request.
         */
        const [anotherCreateCommentResponse] = await createCommentMutation({
            data: {
                body: richTextMock,
                changeRequest: {
                    id: changeRequested.id
                }
            }
        });
        const secondComment =
            anotherCreateCommentResponse.data.advancedPublishingWorkflow.createComment.data;

        /**
         * Again, list all comments for a given change request.
         */
        const [listCommentsResponse2] = await listCommentsQuery({
            where: {
                changeRequest: {
                    id: changeRequested.id
                }
            }
        });
        expect(listCommentsResponse2).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listComments: {
                        data: [
                            {
                                id: secondComment.id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: {
                                    id: changeRequested.id,
                                    entryId: expect.any(String),
                                    modelId: expect.any(String)
                                }
                            },
                            {
                                id: firstComment.id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: {
                                    id: changeRequested.id,
                                    entryId: expect.any(String),
                                    modelId: expect.any(String)
                                }
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 2,
                            cursor: null
                        }
                    }
                }
            }
        });
    });

    test("should able to delete all comments when a change request gets deleted", async () => {
        /*
         * Create two new change request entries.
         */
        const changesRequested = [];
        for (let i = 0; i < 2; i++) {
            const [createChangeRequestedResponse] = await createChangeRequestedMutation({
                data: CHANGE_REQUESTED_MOCK
            });
            changesRequested.push(
                createChangeRequestedResponse.data.advancedPublishingWorkflow.createChangeRequested
                    .data
            );
        }

        /**
         * Add two comments on each change request.
         */
        const comments = [];
        for (let i = 0; i < changesRequested.length; i++) {
            for (let j = 0; j < 2; j++) {
                const [createCommentResponse] = await createCommentMutation({
                    data: {
                        body: richTextMock,
                        changeRequest: {
                            id: changesRequested[i].id
                        }
                    }
                });
                comments.push(
                    createCommentResponse.data.advancedPublishingWorkflow.createComment.data
                );
            }
        }

        /**
         * List all comments.
         */
        let [listCommentsResponse] = await listCommentsQuery({});
        expect(listCommentsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listComments: {
                        data: [
                            {
                                id: comments[3].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: {
                                    id: changesRequested[1].id,
                                    entryId: expect.any(String),
                                    modelId: expect.any(String)
                                }
                            },
                            {
                                id: comments[2].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: {
                                    id: changesRequested[1].id,
                                    entryId: expect.any(String),
                                    modelId: expect.any(String)
                                }
                            },
                            {
                                id: comments[1].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: {
                                    id: changesRequested[0].id,
                                    entryId: expect.any(String),
                                    modelId: expect.any(String)
                                }
                            },
                            {
                                id: comments[0].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: {
                                    id: changesRequested[0].id,
                                    entryId: expect.any(String),
                                    modelId: expect.any(String)
                                }
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 4,
                            cursor: null
                        }
                    }
                }
            }
        });
        /**
         * Let's delete the first change request.
         */
        const [deleteChangeRequested] = await deleteChangeRequestedMutation({
            id: changesRequested[0].id
        });
        expect(deleteChangeRequested).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    deleteChangeRequested: {
                        data: true,
                        error: null
                    }
                }
            }
        });
        /**
         * List all the comments associated with the deleted change request.
         */
        [listCommentsResponse] = await listCommentsQuery({
            where: {
                changeRequest: {
                    id: changesRequested[0].id
                }
            }
        });
        expect(listCommentsResponse).toEqual({
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

        /**
         * List all the comments without any filters.
         */
        [listCommentsResponse] = await listCommentsQuery({});
        expect(listCommentsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listComments: {
                        data: [
                            {
                                id: comments[3].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: {
                                    id: changesRequested[1].id,
                                    entryId: expect.any(String),
                                    modelId: expect.any(String)
                                }
                            },
                            {
                                id: comments[2].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: {
                                    id: changesRequested[1].id,
                                    entryId: expect.any(String),
                                    modelId: expect.any(String)
                                }
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 2,
                            cursor: null
                        }
                    }
                }
            }
        });
    });
});
