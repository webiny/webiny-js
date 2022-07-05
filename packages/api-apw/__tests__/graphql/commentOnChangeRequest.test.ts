import { mocks as changeRequestMock } from "./mocks/changeRequest";
import { createPageContentReviewSetup } from "../utils/helpers";
import { usePageBuilderHandler } from "../utils/usePageBuilderHandler";

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

const expectedComment = expect.objectContaining({
    id: expect.any(String),
    createdOn: expect.stringMatching(/^20/),
    savedOn: expect.stringMatching(/^20/),
    createdBy: {
        id: expect.any(String),
        displayName: expect.any(String),
        type: "admin"
    },
    body: richTextMock,
    changeRequest: expect.any(String)
});

describe("Comment on a change request test", () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = usePageBuilderHandler({
        ...options
    });

    const {
        createChangeRequestMutation,
        createCommentMutation,
        listCommentsQuery,
        deleteChangeRequestMutation,
        until
    } = gqlHandler;

    const getChangeRequestStep = async () => {
        const { contentReview } = await createPageContentReviewSetup(gqlHandler);
        return `${contentReview.id}#${contentReview.steps[0].id}`;
    };

    test("should able to comment on a change request", async () => {
        const { contentReview } = await createPageContentReviewSetup(gqlHandler);
        const changeRequestStep = `${contentReview.id}#${contentReview.steps[0].id}`;
        /*
         * Create a new change request entry.
         */
        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequestMock.createChangeRequestInput({ step: changeRequestStep })
        });
        const changeRequested = createChangeRequestResponse.data.apw.createChangeRequest.data;

        /**
         * Add a comment to this change request.
         */
        const [createCommentResponse] = await createCommentMutation({
            data: {
                body: richTextMock,
                changeRequest: changeRequested.id
            }
        });
        const firstComment = createCommentResponse.data.apw.createComment.data;
        expect(createCommentResponse).toEqual({
            data: {
                apw: {
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
                            changeRequest: changeRequested.id,
                            media: null
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => listCommentsQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listComments.data.length === 1,
            {
                name: "Wait for entry to be available via list query"
            }
        );

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
                apw: {
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
                                changeRequest: changeRequested.id,
                                media: null
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
                changeRequest: changeRequested.id
            }
        });
        const secondComment = anotherCreateCommentResponse.data.apw.createComment.data;

        await until(
            () => listCommentsQuery({}).then(([data]) => data),
            (response: any) => response.data.apw.listComments.data.length === 2,
            {
                name: "Wait for entry to be available via list query"
            }
        );

        /**
         * Again, list all comments for a given change request.
         */
        const [listCommentsResponse2] = await listCommentsQuery({
            where: {
                changeRequest: {
                    id: changeRequested.id
                }
            },
            sort: ["createdOn_DESC"]
        });
        expect(listCommentsResponse2).toEqual({
            data: {
                apw: {
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
                                changeRequest: changeRequested.id,
                                media: null
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
                                changeRequest: changeRequested.id,
                                media: null
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
        const changeRequestStep = await getChangeRequestStep();
        /*
         * Create two new change request entries.
         */
        const changesRequested: { id: string }[] = [];
        for (let i = 0; i < 2; i++) {
            const [createChangeRequestResponse] = await createChangeRequestMutation({
                data: changeRequestMock.createChangeRequestInput({ step: changeRequestStep })
            });
            changesRequested.push(createChangeRequestResponse.data.apw.createChangeRequest.data);
        }
        const totalChangeRequest = 2;
        const commentsPerChangeRequest = 20;
        const totalComments = totalChangeRequest * commentsPerChangeRequest;
        /**
         * Add two comments on each change request.
         */
        const comments = [];
        for (let i = 0; i < changesRequested.length; i++) {
            for (let j = 0; j < commentsPerChangeRequest; j++) {
                const [createCommentResponse] = await createCommentMutation({
                    data: {
                        body: richTextMock,
                        changeRequest: changesRequested[i].id
                    }
                });
                comments.push(createCommentResponse.data.apw.createComment.data);
            }
        }

        await until(
            () => listCommentsQuery({}).then(([data]) => data),
            (response: any) => {
                return response.data.apw.listComments.meta.totalCount === totalComments;
            },
            {
                name: "Wait for entry to be available via list query"
            }
        );

        /**
         * List all comments.
         */
        let [listCommentsResponse] = await listCommentsQuery({ sort: ["createdOn_DESC"] });
        expect(listCommentsResponse).toEqual({
            data: {
                apw: {
                    listComments: {
                        data: expect.arrayContaining([expectedComment]),
                        error: null,
                        meta: {
                            hasMoreItems: true,
                            totalCount: totalComments,
                            cursor: expect.any(String)
                        }
                    }
                }
            }
        });
        /**
         * Let's delete the first change request.
         */
        const [deleteChangeRequest] = await deleteChangeRequestMutation({
            id: changesRequested[0].id
        });
        expect(deleteChangeRequest).toEqual({
            data: {
                apw: {
                    deleteChangeRequest: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        await until(
            () =>
                listCommentsQuery({
                    where: {
                        changeRequest: {
                            id: changesRequested[0].id
                        }
                    }
                }).then(([data]) => data),
            (response: any) => {
                return response.data.apw.listComments.meta.totalCount === 0;
            },
            {
                name: "Wait for entry to be removed from list query"
            }
        );

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
                apw: {
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
        [listCommentsResponse] = await listCommentsQuery({
            sort: ["createdOn_DESC"],
            limit: commentsPerChangeRequest
        });
        expect(listCommentsResponse).toEqual({
            data: {
                apw: {
                    listComments: {
                        data: expect.arrayContaining([expectedComment]),
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: commentsPerChangeRequest,
                            cursor: null
                        }
                    }
                }
            }
        });
    });

    test(`should return error when trying commenting on non-existing change request`, async () => {
        /**
         * Try adding a comment to a non-existing change request.
         */
        let [createCommentResponse] = await createCommentMutation({
            data: {
                body: richTextMock,
                changeRequest: ""
            }
        });
        expect(createCommentResponse).toEqual({
            data: {
                apw: {
                    createComment: {
                        data: null,
                        error: {
                            code: "MALFORMED_CHANGE_REQUEST_ID",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });

        [createCommentResponse] = await createCommentMutation({
            data: {
                body: richTextMock,
                changeRequest: "6205072093e05300095591a2#0001"
            }
        });
        expect(createCommentResponse).toEqual({
            data: {
                apw: {
                    createComment: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
    });
});
