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
    title: "Please replace this heading",
    body: richTextMock,
    media: {
        src: "cloudfront.net/my-file"
    }
};

describe("ChangeRequested crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        getChangeRequestedQuery,
        listChangesRequestedQuery,
        createChangeRequestedMutation,
        updateChangeRequestedMutation,
        deleteChangeRequestedMutation
    } = useContentGqlHandler({
        ...options
    });
    test("should able to create, update, get, list and delete a comment", async () => {
        /*
         * Should return error in case of no entry found.
         */
        const [getChangeRequestedResponse] = await getChangeRequestedQuery({ id: "123" });
        expect(getChangeRequestedResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getChangeRequested: {
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
        const [createChangeRequestedResponse] = await createChangeRequestedMutation({
            data: changeRequested
        });
        const { id } =
            createChangeRequestedResponse.data.advancedPublishingWorkflow.createChangeRequested
                .data;

        expect(createChangeRequestedResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    createChangeRequested: {
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
        const [getChangeRequestedByIdResponse] = await getChangeRequestedQuery({ id: id });
        expect(getChangeRequestedByIdResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getChangeRequested: {
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
        const [updateChangeRequestedResponse] = await updateChangeRequestedMutation({
            id,
            data: {
                body: updatedRichText,
                resolved: true
            }
        });
        expect(updateChangeRequestedResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    updateChangeRequested: {
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
        const [listChangesRequestedResponse] = await listChangesRequestedQuery({ where: {} });
        expect(listChangesRequestedResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangesRequested: {
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
        const [deleteChangeRequestedResponse] = await deleteChangeRequestedMutation({ id });
        expect(deleteChangeRequestedResponse).toEqual({
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
         * Now that we've deleted the only entry we had, we should get empty list as response.
         */
        const [listChangesRequestedAgainResponse] = await listChangesRequestedQuery({ where: {} });
        expect(listChangesRequestedAgainResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangesRequested: {
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
