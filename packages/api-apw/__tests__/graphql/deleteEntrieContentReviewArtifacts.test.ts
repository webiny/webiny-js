import { createSetupForPageContentReview } from "../utils/helpers";
import { usePageBuilderHandler } from "../utils/usePageBuilderHandler";
import { mocks as changeRequestMock, richTextMock } from "./mocks/changeRequest";

describe(`Delete "content review" and associated "change requests" and "comments"`, () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = usePageBuilderHandler({
        ...options
    });
    const {
        createContentReviewMutation,
        getContentReviewQuery,
        createChangeRequestMutation,
        createCommentMutation,
        listChangeRequestsQuery,
        listCommentsQuery,
        deleteContentReviewMutation,
        getPageQuery
    } = gqlHandler;

    /**
     * Let's do the setup.
     */
    const setup = async () => {
        const { page } = await createSetupForPageContentReview(gqlHandler);
        return {
            page
        };
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

    test(`Should able to "delete" entire content review process`, async () => {
        const { page } = await setup();

        /**
         *  Initial a review.
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

        /**
         * Fetch the content review and check contentReview status.
         */
        let [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        const contentReview = getContentReviewResponse.data.apw.getContentReview.data;
        expect(contentReview.status).toEqual("underReview");

        /**
         * Let's create a "change request" for every step of the publishing workflow.
         */
        const changeRequests = [];

        for (let i = 0; i < contentReview.steps.length; i++) {
            const currentStep = contentReview.steps[i];
            const changeRequestStep = `${contentReview.id}#${currentStep.id}`;

            const [createChangeRequestResponse] = await createChangeRequestMutation({
                data: changeRequestMock.createChangeRequestInput({ step: changeRequestStep })
            });
            const changeRequest = createChangeRequestResponse.data.apw.createChangeRequest.data;
            /**
             * Save it for later.
             */
            changeRequests.push(changeRequest);
            /**
             * Let's add two comments for each of these "change requests".
             */

            for (let j = 0; j < 2; j++) {
                const [createCommentResponse] = await createCommentMutation({
                    data: {
                        body: richTextMock,
                        changeRequest: changeRequest.id,
                        media: {
                            src: "cloudfront.net/my-file"
                        }
                    }
                });
                expect(createCommentResponse).toEqual({
                    data: {
                        apw: {
                            createComment: {
                                error: null,
                                data: expect.any(Object)
                            }
                        }
                    }
                });
            }
        }

        /**
         * Fetch the content review and check if the updates were successful.
         */
        [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });

        expect(getContentReviewResponse.data.apw.getContentReview.data).toEqual({
            content: expect.objectContaining(expectedContent),
            createdBy: {
                displayName: expect.any(String),
                id: expect.any(String),
                type: expect.any(String)
            },
            createdOn: expect.stringMatching(/^20/),
            id: expect.any(String),
            savedOn: expect.stringMatching(/^20/),
            status: "underReview",
            steps: [
                {
                    id: expect.any(String),
                    pendingChangeRequests: 1,
                    signOffProvidedBy: null,
                    signOffProvidedOn: null,
                    status: "active"
                },
                {
                    id: expect.any(String),
                    pendingChangeRequests: 1,
                    signOffProvidedBy: null,
                    signOffProvidedOn: null,
                    status: "inactive"
                },
                {
                    id: expect.any(String),
                    pendingChangeRequests: 1,
                    signOffProvidedBy: null,
                    signOffProvidedOn: null,
                    status: "inactive"
                }
            ],
            title: expect.any(String)
        });

        const [changeRequest1, changeRequest2, changeRequest3] = changeRequests;
        /**
         * Let's list comments for each change request.
         */
        let [listCommentsResponse] = await listCommentsQuery({
            where: { changeRequest: { id: changeRequest1.id } }
        });
        expect(listCommentsResponse).toEqual({
            data: {
                apw: {
                    listComments: {
                        data: expect.any(Object),
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

        [listCommentsResponse] = await listCommentsQuery({
            where: { changeRequest: { id: changeRequest2.id } }
        });
        expect(listCommentsResponse).toEqual({
            data: {
                apw: {
                    listComments: {
                        data: expect.any(Object),
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

        [listCommentsResponse] = await listCommentsQuery({
            where: { changeRequest: { id: changeRequest3.id } }
        });
        expect(listCommentsResponse).toEqual({
            data: {
                apw: {
                    listComments: {
                        data: expect.any(Object),
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

        /**
         * Let's delete the content review itself.
         */
        const [deleteContentReviewResponse] = await deleteContentReviewMutation({
            id: contentReview.id
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

        /**
         * Should return "NOT_FOUND" error when trying to fetch "content review" after deletion.
         */
        [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });

        expect(getContentReviewResponse).toEqual({
            data: {
                apw: {
                    getContentReview: {
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
        /**
         * Should also delete all linked "changeRequests" after "content review" deletion.
         */
        const [listChangeRequestsResponse] = await listChangeRequestsQuery({});
        expect(listChangeRequestsResponse).toEqual({
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
        /**
         * Should also delete all linked "comments" after "content review" deletion.
         */
        [listCommentsResponse] = await listCommentsQuery({});
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
         * Should unlink attached "contentReview" from page settings after contentReview deletion.
         */
        const [getPageResponse] = await getPageQuery({ id: page.id });
        const pageData = getPageResponse.data.pageBuilder.getPage.data;
        expect(pageData.settings.apw.contentReviewId).toEqual(null);
    });
});
