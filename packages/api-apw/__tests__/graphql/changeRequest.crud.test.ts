import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { createContentReviewSetup } from "../utils/helpers";
import { mocks as changeRequestMock } from "./mocks/changeRequest";

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

describe("ChangeRequest crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });

    const {
        getChangeRequestQuery,
        listChangeRequestsQuery,
        createChangeRequestMutation,
        updateChangeRequestMutation,
        deleteChangeRequestMutation,
        until
    } = gqlHandler;

    test(`should able to create, update, get, list and delete a "change request"`, async () => {
        const { contentReview } = await createContentReviewSetup(gqlHandler);
        const changeRequestStep = `${contentReview.id}#${contentReview.steps[0].id}`;
        /*
         * Create a new entry.
         */
        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequestMock.createChangeRequestInput({ step: changeRequestStep })
        });
        const createdChangeRequest = createChangeRequestResponse.data.apw.createChangeRequest.data;

        expect(createChangeRequestResponse).toEqual({
            data: {
                apw: {
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
                            title: expect.any(String),
                            body: expect.any(Object),
                            media: expect.any(Object),
                            step: expect.any(String),
                            resolved: null
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => getChangeRequestQuery({ id: createdChangeRequest.id }).then(([data]) => data),
            (response: any) => response.data.apw.getChangeRequest.data !== null,
            {
                name: "Wait for getChangeRequest query"
            }
        );

        /**
         *  Now that we have a entry, we should be able to get it.
         */
        const [getChangeRequestByIdResponse] = await getChangeRequestQuery({
            id: createdChangeRequest.id
        });
        expect(getChangeRequestByIdResponse).toEqual({
            data: {
                apw: {
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
                            title: expect.any(String),
                            body: expect.any(Object),
                            media: expect.any(Object),
                            step: expect.any(String),
                            resolved: null
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
            id: createdChangeRequest.id,
            data: {
                body: updatedRichText,
                resolved: true
            }
        });
        expect(updateChangeRequestResponse).toEqual({
            data: {
                apw: {
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
                            title: expect.any(String),
                            body: updatedRichText,
                            media: expect.any(Object),
                            step: expect.any(String),
                            resolved: true
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => listChangeRequestsQuery({}).then(([data]) => data),
            (response: any) => {
                const [updatedItem] = response.data.apw.listChangeRequests.data;
                return updatedItem && createdChangeRequest.savedOn !== updatedItem.savedOn;
            },
            {
                name: "Wait for updated entry to be available via listChangeRequests query"
            }
        );

        /**
         * Let's list all entries should return only one.
         */
        const [listChangeRequestsResponse] = await listChangeRequestsQuery({});
        expect(listChangeRequestsResponse).toEqual({
            data: {
                apw: {
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
                                title: expect.any(String),
                                media: expect.any(Object),
                                step: expect.any(String),
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
        const [deleteChangeRequestResponse] = await deleteChangeRequestMutation({
            id: createdChangeRequest.id
        });
        expect(deleteChangeRequestResponse).toEqual({
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
            () => listChangeRequestsQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listChangeRequests.data;
                return list.length === 0;
            },
            {
                name: "Wait for empty list after deleting entry"
            }
        );

        /**
         * Now that we've deleted the only entry we had, we should get empty list as response.
         */
        const [listChangeRequestsAgainResponse] = await listChangeRequestsQuery({});
        expect(listChangeRequestsAgainResponse).toEqual({
            data: {
                apw: {
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

    test(`should not able to create "change request" with wrong step`, async () => {
        /*
         * Create a new entry.
         */
        let [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequestMock.createChangeRequestInput({
                step: "61af1a60f04e49226e6cc17e#design_review"
            })
        });

        expect(createChangeRequestResponse).toEqual({
            data: {
                apw: {
                    createChangeRequest: {
                        data: null,
                        error: {
                            message: expect.any(String),
                            code: "MALFORMED_CHANGE_REQUEST_STEP",
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
        const nonExistingContentReview = "61af1a60f04e49226e6cc17e#0001#design_review";

        [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequestMock.createChangeRequestInput({
                step: nonExistingContentReview
            })
        });

        expect(createChangeRequestResponse).toEqual({
            data: {
                apw: {
                    createChangeRequest: {
                        data: null,
                        error: {
                            message: expect.any(String),
                            code: "NOT_FOUND",
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
    });
});
