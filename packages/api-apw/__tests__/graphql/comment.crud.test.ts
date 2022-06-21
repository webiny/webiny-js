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

    const gqlHandler = usePageBuilderHandler({
        ...options
    });

    const {
        getCommentQuery,
        listCommentsQuery,
        createCommentMutation,
        updateCommentMutation,
        deleteCommentMutation,
        createChangeRequestMutation,
        until
    } = gqlHandler;

    const setupChangeRequest = async () => {
        const { contentReview } = await createPageContentReviewSetup(gqlHandler);
        const changeRequestStep = `${contentReview.id}#${contentReview.steps[0].id}`;
        /*
         * Create a new entry.
         */
        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequestMock.createChangeRequestInput({ step: changeRequestStep })
        });
        return createChangeRequestResponse.data.apw.createChangeRequest.data;
    };

    test("should able to create, update, get, list and delete a comment", async () => {
        const changeRequest = await setupChangeRequest();
        /*
         * Create a new entry.
         */
        const [createCommentResponse] = await createCommentMutation({
            data: {
                body: richTextMock,
                changeRequest: changeRequest.id,
                media: {
                    src: "cloudfront.net/my-file"
                }
            }
        });
        const comment = createCommentResponse.data.apw.createComment.data;

        expect(createCommentResponse).toEqual({
            data: {
                apw: {
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
                            body: richTextMock,
                            changeRequest: changeRequest.id,
                            media: expect.any(Object)
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => getCommentQuery({ id: comment.id }).then(([data]) => data),
            (response: any) => response.data.apw.getComment.data !== null,
            {
                name: "Wait for getComment query"
            }
        );

        /**
         *  Now that we have an entry, we should be able to get it.
         */
        const [getCommentByIdResponse] = await getCommentQuery({ id: comment.id });
        expect(getCommentByIdResponse).toEqual({
            data: {
                apw: {
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
                            body: richTextMock,
                            changeRequest: changeRequest.id,
                            media: expect.any(Object)
                        },
                        error: null
                    }
                }
            }
        });

        /*
         * Should return error in case of no entry found.
         */
        const [getCommentResponse] = await getCommentQuery({ id: "123" });
        expect(getCommentResponse).toEqual({
            data: {
                apw: {
                    getComment: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: `Entry by ID "123" not found.`
                        }
                    }
                }
            }
        });

        /**
         * Let's update the entry.
         */
        const [updateCommentResponse] = await updateCommentMutation({
            id: comment.id,
            data: {
                body: updatedRichText
            }
        });
        expect(updateCommentResponse).toEqual({
            data: {
                apw: {
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
                            body: updatedRichText,
                            changeRequest: changeRequest.id,
                            media: expect.any(Object)
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => listCommentsQuery({}).then(([data]) => data),
            (response: any) => {
                const [updatedItem] = response.data.apw.listComments.data;
                return updatedItem && comment.savedOn !== updatedItem.savedOn;
            },
            {
                name: "Wait for updated entry to be available via listReviewers query"
            }
        );

        /**
         * Let's list all workflow entries should return only one.
         */
        const [listCommentsResponse] = await listCommentsQuery({ where: {} });
        expect(listCommentsResponse).toEqual({
            data: {
                apw: {
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
                                body: updatedRichText,
                                changeRequest: changeRequest.id,
                                media: expect.any(Object)
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
        const [deleteCommentResponse] = await deleteCommentMutation({ id: comment.id });
        expect(deleteCommentResponse).toEqual({
            data: {
                apw: {
                    deleteComment: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        await until(
            () => listCommentsQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listComments.data;
                return list.length === 0;
            },
            {
                name: "Wait for empty list via listReviewers query after deleting entry"
            }
        );

        /**
         * Now that we've deleted the only entry we had, we should get empty list as response from "listComments".
         */
        const [listCommentsAgainResponse] = await listCommentsQuery({});
        expect(listCommentsAgainResponse).toEqual({
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
    });
});
