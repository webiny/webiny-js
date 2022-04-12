import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { ApwContentReviewStepStatus } from "~/types";
import { createSetupForContentReview } from "../utils/helpers";

describe("Content Review crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const identityRoot = { id: "root", displayName: "root", type: "admin" };

    const gqlHandler = useContentGqlHandler({
        ...options
    });

    const rootGqlHandler = useContentGqlHandler({
        ...options,
        identity: identityRoot
    });

    const {
        getContentReviewQuery,
        createContentReviewMutation,
        deleteContentReviewMutation,
        listContentReviewsQuery,
        until
    } = gqlHandler;

    const setup = async () => {
        return createSetupForContentReview(gqlHandler);
    };

    const expectedContent = {
        id: expect.any(String),
        type: expect.any(String),
        version: expect.any(Number),
        settings: null,
        publishedBy: null,
        publishedOn: null,
        scheduledBy: null,
        scheduledOn: null
    };

    test(`should able to create, update, get, list and delete "Content Review"`, async () => {
        const { page, workflow } = await setup();
        /*
         Create a content review entry.
        */
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page"
                }
            }
        });

        const createdContentReview = createContentReviewResponse.data.apw.createContentReview.data;

        expect(createContentReviewResponse).toEqual({
            data: {
                apw: {
                    createContentReview: {
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
                            status: "underReview",
                            steps: workflow.steps.map((_, index) => ({
                                status:
                                    index === 0
                                        ? ApwContentReviewStepStatus.ACTIVE
                                        : ApwContentReviewStepStatus.INACTIVE,
                                id: expect.any(String),
                                pendingChangeRequests: 0,
                                signOffProvidedOn: null,
                                signOffProvidedBy: null
                            })),
                            content: expect.objectContaining(expectedContent)
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => response.data.apw.getContentReview.data !== null,
            {
                name: "Wait for getContentReview query"
            }
        );

        /*
         Now that we have a content review entry, we should be able to get it
        */
        const [getContentReviewByIdResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(getContentReviewByIdResponse).toEqual({
            data: {
                apw: {
                    getContentReview: {
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
                            status: "underReview",
                            steps: workflow.steps.map((_, index) => ({
                                status:
                                    index === 0
                                        ? ApwContentReviewStepStatus.ACTIVE
                                        : ApwContentReviewStepStatus.INACTIVE,
                                id: expect.any(String),
                                pendingChangeRequests: 0,
                                signOffProvidedOn: null,
                                signOffProvidedBy: null
                            })),
                            content: expect.objectContaining(expectedContent)
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listContentReviews.data;
                return list.length === 1;
            },
            {
                name: "Wait for updated entry to be available in list query"
            }
        );

        /*
         Let's list all workflow entries there should be only one
        */
        const [listContentReviewsResponse] = await listContentReviewsQuery({});
        expect(listContentReviewsResponse).toEqual({
            data: {
                apw: {
                    listContentReviews: {
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
                                status: "underReview",
                                steps: workflow.steps.map((_, index) => ({
                                    status:
                                        index === 0
                                            ? ApwContentReviewStepStatus.ACTIVE
                                            : ApwContentReviewStepStatus.INACTIVE,
                                    id: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                })),
                                totalComments: 0,
                                content: expect.objectContaining(expectedContent),
                                activeStep: {
                                    title: expect.any(String)
                                },
                                latestCommentId: null,
                                reviewers: expect.arrayContaining([expect.any(String)])
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

        /*
         Delete the only entry we have
        */
        const [deleteContentReviewResponse] = await deleteContentReviewMutation({
            id: createdContentReview.id
        });
        expect(deleteContentReviewResponse).toEqual({
            data: {
                apw: {
                    deleteContentReview: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listContentReviews.data;
                return list.length === 0;
            },
            {
                name: "Wait for entry to be removed from list query"
            }
        );

        /*
         Now that we've deleted the only entry we had, we should get empty list as response from "listContentReviewsQuery"
        */
        const [listContentReviewsAgainResponse] = await listContentReviewsQuery({ where: {} });
        expect(listContentReviewsAgainResponse).toEqual({
            data: {
                apw: {
                    listContentReviews: {
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

    test(`should able to filter "Content Review" list by "requiresMyAttention" status`, async () => {
        const { page, workflow } = await setup();
        /*
         Create a content review entry.
        */
        await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page"
                }
            }
        });

        /*
         * List all the content reviews that requires the current logged in user's attention.
         */
        const [listContentReviewsResponse] = await listContentReviewsQuery({
            where: {
                status: "requiresMyAttention"
            }
        });
        expect(listContentReviewsResponse).toEqual({
            data: {
                apw: {
                    listContentReviews: {
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
                                status: "underReview",
                                steps: workflow.steps.map((_, index) => ({
                                    status:
                                        index === 0
                                            ? ApwContentReviewStepStatus.ACTIVE
                                            : ApwContentReviewStepStatus.INACTIVE,
                                    id: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                })),
                                totalComments: 0,
                                content: expect.objectContaining(expectedContent),
                                activeStep: {
                                    title: expect.any(String)
                                },
                                latestCommentId: null,
                                reviewers: expect.arrayContaining([expect.any(String)])
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

        /*
         * List all the content reviews that requires the root user's attention.
         */
        const [listContentReviewsRootResponse] = await rootGqlHandler.listContentReviewsQuery({
            where: {
                status: "requiresMyAttention"
            }
        });
        expect(listContentReviewsRootResponse).toEqual({
            data: {
                apw: {
                    listContentReviews: {
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

        /*
         * Should be able to get created content reviews when using "listContentReviewsQuery" without filters .
         */
        const [listContentReviewsResponse2] = await rootGqlHandler.listContentReviewsQuery({});
        expect(listContentReviewsResponse2).toEqual({
            data: {
                apw: {
                    listContentReviews: {
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
                                status: "underReview",
                                steps: expect.arrayContaining([
                                    expect.objectContaining({
                                        status: expect.any(String),
                                        id: expect.any(String),
                                        pendingChangeRequests: 0,
                                        signOffProvidedOn: null,
                                        signOffProvidedBy: null
                                    })
                                ]),
                                totalComments: 0,
                                content: expect.objectContaining(expectedContent),
                                activeStep: {
                                    title: expect.any(String)
                                },
                                latestCommentId: null,
                                reviewers: expect.arrayContaining([expect.any(String)])
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
