import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { mocks as changeRequestMock, richTextMock } from "./mocks/changeRequest";
import { createSetupForContentReview } from "../utils/helpers";

describe(`Total comments count test`, () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });
    const {
        createChangeRequestMutation,
        createContentReviewMutation,
        listContentReviewsQuery,
        listChangeRequestsQuery,
        createCommentMutation,
        listCommentsQuery,
        deleteCommentMutation,
        until
    } = gqlHandler;

    const createContentReview = async page => {
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page",
                    workflowId: page.settings.apw.workflowId
                }
            }
        });
        return createContentReviewResponse.data.apw.createContentReview.data;
    };
    const expectedSteps = expect.arrayContaining([
        {
            id: expect.any(String),
            status: expect.any(String),
            pendingChangeRequests: 1,
            signOffProvidedOn: null,
            signOffProvidedBy: null
        }
    ]);

    test(`should able to update "totalComments" count in a content review`, async () => {
        const { page } = await createSetupForContentReview(gqlHandler);
        const contentReview = await createContentReview(page);
        const [step1] = contentReview.steps;

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.apw.listContentReviews.data;
                return list.length === 1;
            },
            {
                name: `Wait for "ContentReview" entry to be available in list query`
            }
        );

        /*
         * Create a new change request entry for step 1.
         */
        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequestMock.createChangeRequestInput({
                step: `${contentReview.id}#${step1.id}`
            })
        });
        const changeRequested = createChangeRequestResponse.data.apw.createChangeRequest.data;

        await until(
            () => listChangeRequestsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.apw.listChangeRequests.data;
                return list.length === 1;
            },
            {
                name: `Wait for "ChangeRequest" entry to be available in list query`
            }
        );

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            response => {
                const [entry] = response.data.apw.listContentReviews.data;
                return entry.steps.find(step => step.id === step1.id).pendingChangeRequests === 1;
            },
            {
                name: "Wait for updated entry to be available in list query"
            }
        );

        /*
         * Add two comments on to the change request.
         */
        const createdComments = [];
        for (let i = 0; i < 2; i++) {
            const [createCommentResponse] = await createCommentMutation({
                data: {
                    body: richTextMock,
                    changeRequest: changeRequested.id
                }
            });

            const comment = createCommentResponse.data.apw.createComment.data;
            createdComments.push(comment);
        }

        await until(
            () =>
                listCommentsQuery({ changeRequest: { id: changeRequested.id } }).then(
                    ([data]) => data
                ),
            response => {
                const list = response.data.apw.listComments.data;
                return list.length === 2;
            },
            {
                name: `Wait for "Comments" entry to be available in list query`
            }
        );

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            response => {
                const [entry] = response.data.apw.listContentReviews.data;
                return entry.totalComments === 2;
            },
            {
                name: `Wait for updated "totalComments" count to be available in list query`
            }
        );
        const [comment1, comment2] = createdComments;
        /**
         * Should have 2 as totalComments count.
         */
        let [listContentReviewsResponse] = await listContentReviewsQuery({});
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
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                status: "underReview",
                                content: {
                                    id: expect.any(String),
                                    type: "page",
                                    workflowId: expect.any(String),
                                    title: expect.any(String),
                                    version: expect.any(Number),
                                    settings: null
                                },
                                steps: expectedSteps,
                                totalComments: 2,
                                activeStep: {
                                    title: expect.any(String)
                                },
                                latestCommentId: comment2.id
                            }
                        ],
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 1
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Let's delete the first comment.
         */

        const [deleteCommentResponse] = await deleteCommentMutation({ id: comment1.id });
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
            () =>
                listCommentsQuery({ changeRequest: { id: changeRequested.id } }).then(
                    ([data]) => data
                ),
            response => {
                const list = response.data.apw.listComments.data;
                return list.length === 1;
            },
            {
                name: `Wait for delete comment operation reflect in list query`
            }
        );

        /**
         * Should have 1 as totalComments count.
         */
        [listContentReviewsResponse] = await listContentReviewsQuery({});
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
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                status: "underReview",
                                content: {
                                    id: expect.any(String),
                                    type: "page",
                                    workflowId: expect.any(String),
                                    title: expect.any(String),
                                    version: expect.any(Number),
                                    settings: null
                                },
                                steps: expectedSteps,
                                totalComments: 1,
                                activeStep: {
                                    title: expect.any(String)
                                },
                                latestCommentId: expect.any(String)
                            }
                        ],
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 1
                        },
                        error: null
                    }
                }
            }
        });
    });
});
