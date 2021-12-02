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
const changeRequested = {
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

    const { createChangeRequestedMutation, createCommentMutation, listCommentsQuery } =
        useContentGqlHandler({
            ...options
        });
    test("should able to comment on a change request", async () => {
        /*
         * Create a new change request entry.
         */
        const [createChangeRequestedResponse] = await createChangeRequestedMutation({
            data: changeRequested
        });
        const { id } =
            createChangeRequestedResponse.data.advancedPublishingWorkflow.createChangeRequested
                .data;

        /**
         * Add a comment to this change request.
         */
        const [createCommentResponse] = await createCommentMutation({
            data: {
                body: richTextMock,
                changeRequest: id
            }
        });

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
                            changeRequest: id
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * List all comments for a given change request.
         */
        const [listCommentsResponse] = await listCommentsQuery({ where: { changeRequest: id } });
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
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                changeRequest: id
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
    });
});
