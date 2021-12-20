import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { ApwContentReviewStepStatus } from "~/types";
import { createSetupForContentReview } from "../utils/helpers";

describe("Content Review crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });
    const {
        getContentReviewQuery,
        createContentReviewMutation,
        deleteContentReviewMutation,
        listContentReviewsQuery,
        updateContentReviewMutation,
        until
    } = gqlHandler;

    const setup = async () => {
        return createSetupForContentReview(gqlHandler);
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
                            status: "underReview",
                            steps: workflow.steps.map((_, index) => ({
                                status:
                                    index === 0
                                        ? ApwContentReviewStepStatus.ACTIVE
                                        : ApwContentReviewStepStatus.INACTIVE,
                                slug: expect.any(String),
                                pendingChangeRequests: 0,
                                signOffProvidedOn: null,
                                signOffProvidedBy: null
                            })),
                            content: {
                                id: expect.any(String),
                                type: expect.any(String),
                                settings: null
                            }
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            response => response.data.apw.getContentReview.data !== null,
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
                            status: "underReview",
                            steps: workflow.steps.map((_, index) => ({
                                status:
                                    index === 0
                                        ? ApwContentReviewStepStatus.ACTIVE
                                        : ApwContentReviewStepStatus.INACTIVE,
                                slug: expect.any(String),
                                pendingChangeRequests: 0,
                                signOffProvidedOn: null,
                                signOffProvidedBy: null
                            })),
                            content: {
                                id: expect.any(String),
                                type: expect.any(String),
                                settings: null
                            }
                        },
                        error: null
                    }
                }
            }
        });

        /*
         Let's update the entry with some change requested
        */
        const [updateContentReviewResponse] = await updateContentReviewMutation({
            id: createdContentReview.id,
            data: {}
        });

        expect(updateContentReviewResponse).toEqual({
            data: {
                apw: {
                    updateContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            status: "underReview",
                            steps: workflow.steps.map((_, index) => ({
                                status:
                                    index === 0
                                        ? ApwContentReviewStepStatus.ACTIVE
                                        : ApwContentReviewStepStatus.INACTIVE,
                                slug: expect.any(String),
                                pendingChangeRequests: 0,
                                signOffProvidedOn: null,
                                signOffProvidedBy: null
                            })),
                            content: {
                                id: expect.any(String),
                                type: expect.any(String),
                                settings: null
                            }
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            response => {
                const [updatedEntry] = response.data.apw.listContentReviews.data;
                return updatedEntry && updatedEntry.savedOn !== createdContentReview.savedOn;
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
                                status: "underReview",
                                steps: workflow.steps.map((_, index) => ({
                                    status:
                                        index === 0
                                            ? ApwContentReviewStepStatus.ACTIVE
                                            : ApwContentReviewStepStatus.INACTIVE,
                                    slug: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                })),
                                content: {
                                    id: expect.any(String),
                                    type: expect.any(String),
                                    settings: null
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
            response => {
                const list = response.data.apw.listContentReviews.data;
                return list.length === 0;
            },
            {
                name: "Wait for entry to be removed from list query"
            }
        );

        /*
         Now that we've deleted the only entry we had, we should get empty list as response from "listWorkflows"
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
});
