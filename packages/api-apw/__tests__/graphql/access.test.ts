/**
 * This test will check if the user, which has access to a single model, can do valid actions.
 */
import { CmsModel } from "@webiny/api-headless-cms/types";
import { accessTestGroup, accessTestModel } from "./mocks/access/plugins";
import { permissions } from "./mocks/access/permissions";
import mocks from "./mocks/workflows";
import { ApwWorkflowApplications } from "~/types";
import { useGraphQlHandler } from "~tests/utils/useGraphQlHandler";

const model = accessTestModel.contentModel as CmsModel;

describe("access", () => {
    const workflowIdentity = {
        id: "90962378",
        type: "admin",
        displayName: "Workflow Name",
        email: "worflow-mock@webiny.local"
    };

    const gqlHandler = useGraphQlHandler({
        path: "/graphql",
        plugins: [accessTestGroup, accessTestModel],
        storageOperationPlugins: []
    });

    const {
        securityIdentity,
        reviewer: reviewerGQL,
        // workflow
        createWorkflowMutation,
        // content review
        createContentReviewMutation,
        getContentReviewQuery,
        deleteContentReviewMutation,
        // comment
        createCommentMutation,
        updateCommentMutation,
        deleteCommentMutation,
        getCommentQuery,
        // change request
        createChangeRequestMutation,
        updateChangeRequestMutation,
        deleteChangeRequestMutation
    } = gqlHandler;

    const {
        // content entry
        createContentEntryMutation,
        // utils
        until
    } = useGraphQlHandler({
        path: "/cms/manage/en-US",
        identity: {
            id: "someUserId",
            displayName: "User",
            type: "user",
            email: "testing@webiny.com"
        },
        permissions,
        plugins: [accessTestGroup, accessTestModel]
    });

    const login = async () => {
        return await securityIdentity.login();
    };

    const setupReviewer = async () => {
        await login();

        await until(
            () => reviewerGQL.listReviewersQuery({}).then(([data]) => data),
            (response: any) => {
                return response.data.apw.listReviewers.data.length === 1;
            },
            {
                name: "Wait for listReviewers"
            }
        );

        const [listReviewersResponse] = await reviewerGQL.listReviewersQuery({});
        const [reviewer] = listReviewersResponse.data.apw.listReviewers.data;
        return reviewer;
    };

    const entryTitle = "Test entry #1";
    let entryId: string;

    beforeEach(async () => {
        const reviewer = await setupReviewer();
        const createWorkflowInput = mocks.createWorkflow(
            {
                title: `Main review workflow - CMS`,
                app: ApwWorkflowApplications.CMS,
                scope: {
                    type: "custom",
                    data: {
                        models: [model.modelId]
                    }
                }
            },
            [reviewer]
        );

        const [createWorkflowResponse] = await createWorkflowMutation({
            data: createWorkflowInput
        });
        if (createWorkflowResponse.data?.apw?.createWorkflow?.error?.message) {
            throw new Error(createWorkflowResponse.data?.apw?.createWorkflow?.error?.message);
        } else if (!createWorkflowResponse.data?.apw?.createWorkflow?.data?.id) {
            throw new Error(`Could not create workflow.`);
        }

        const [createEntryResponse] = await createContentEntryMutation(model, {
            data: {
                title: entryTitle
            }
        });

        if (!createEntryResponse.data?.createAccessTestModel?.data?.id) {
            throw new Error(`Missing content entry.`);
        }

        entryId = createEntryResponse.data.createAccessTestModel.data.id;
    });

    const setupContentReview = async () => {
        if (!entryId) {
            throw new Error(`Missing "entryId" - should be created before calling this method.`);
        }
        const [createReviewRequestResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: entryId,
                    type: "cms_entry",
                    settings: {
                        modelId: model.modelId
                    }
                }
            }
        });
        return createReviewRequestResponse;
    };

    it("should create request for review and delete it", async () => {
        const createContentReviewResponse = await setupContentReview();

        expect(createContentReviewResponse).toMatchObject({
            data: {
                apw: {
                    createContentReview: {
                        data: {
                            id: expect.any(String),
                            content: {
                                id: entryId
                            },
                            steps: [
                                {
                                    id: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedBy: null,
                                    signOffProvidedOn: null,
                                    status: "active"
                                }
                            ],
                            title: entryTitle
                        },
                        error: null
                    }
                }
            }
        });

        const contentReviewId = createContentReviewResponse.data.apw.createContentReview.data.id;

        const [getReviewRequestResponse] = await getContentReviewQuery({
            id: contentReviewId
        });

        expect(getReviewRequestResponse).toMatchObject({
            data: {
                apw: {
                    getContentReview: {
                        data: {
                            id: contentReviewId
                        },
                        error: null
                    }
                }
            }
        });

        const [deleteReviewRequestResponse] = await deleteContentReviewMutation({
            id: contentReviewId
        });

        expect(deleteReviewRequestResponse).toMatchObject({
            data: {
                apw: {
                    deleteContentReview: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });

    it("should create change request, update it and delete it", async () => {
        const createContentReviewResponse = await setupContentReview();
        const contentReview = createContentReviewResponse.data.apw.createContentReview.data;

        const changeRequestStepId = `${contentReview.id}#${contentReview.steps[0].id}`;

        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: {
                step: changeRequestStepId,
                title: `Requesting change on "${entryTitle}"`,
                body: [
                    {
                        type: "h1",
                        text: "Really important!"
                    }
                ],
                resolved: false,
                media: {
                    src: "cloudfront.net/my-file"
                }
            }
        });

        expect(createChangeRequestResponse).toMatchObject({
            data: {
                apw: {
                    createChangeRequest: {
                        data: {
                            id: expect.any(String),
                            step: changeRequestStepId
                        },
                        error: null
                    }
                }
            }
        });

        const changeRequestId = createChangeRequestResponse.data.apw.createChangeRequest.data.id;

        const [updateChangeRequestResponse] = await updateChangeRequestMutation({
            id: changeRequestId,
            data: {
                title: `Requesting change on "${entryTitle}" - updated`,
                body: [
                    {
                        type: "h1",
                        text: "Really important! - updated"
                    }
                ],
                resolved: false,
                media: {
                    src: "cloudfront.net/my-file-updated"
                }
            }
        });

        expect(updateChangeRequestResponse).toMatchObject({
            data: {
                apw: {
                    updateChangeRequest: {
                        data: {
                            id: expect.any(String),
                            step: changeRequestStepId,
                            title: `Requesting change on "${entryTitle}" - updated`,
                            body: [
                                {
                                    type: "h1",
                                    text: "Really important! - updated"
                                }
                            ],
                            resolved: false,
                            media: {
                                src: "cloudfront.net/my-file-updated"
                            }
                        },
                        error: null
                    }
                }
            }
        });

        const [deleteChangeRequestResponse] = await deleteChangeRequestMutation({
            id: changeRequestId
        });

        expect(deleteChangeRequestResponse).toMatchObject({
            data: {
                apw: {
                    deleteChangeRequest: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });

    it("should not able to update the change request, when user is not the owner", async () => {
        const createContentReviewResponse = await setupContentReview();
        const contentReview = createContentReviewResponse.data.apw.createContentReview.data;
        const changeRequestStepId = `${contentReview.id}#${contentReview.steps[0].id}`;

        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: {
                step: changeRequestStepId,
                title: `Requesting change on "${entryTitle}"`,
                body: [
                    {
                        type: "h1",
                        text: "Really important!"
                    }
                ],
                resolved: false,
                media: {
                    src: "cloudfront.net/my-file"
                }
            }
        });

        /**
         * Login another user, that is not creator of the change request.
         */
        const notChangeRequestCreatorHandler = useGraphQlHandler({
            path: "/graphql",
            identity: workflowIdentity
        });
        await notChangeRequestCreatorHandler.securityIdentity.login();

        /**
         * Try to update the same change request with other user
         */
        const changeRequestId = createChangeRequestResponse.data.apw.createChangeRequest.data.id;
        const [updateChangeRequestResponse] =
            await notChangeRequestCreatorHandler.updateChangeRequestMutation({
                id: changeRequestId,
                data: {
                    title: `Requesting change on "${entryTitle}" - updated`,
                    body: [
                        {
                            type: "h1",
                            text: "Really important! - updated"
                        }
                    ],
                    resolved: false,
                    media: {
                        src: "cloudfront.net/my-file-updated"
                    }
                }
            });

        expect(updateChangeRequestResponse.data?.apw?.updateChangeRequest).toMatchObject({
            data: null,
            error: {
                message: "A change request can only be updated by its creator.",
                code: "ONLY_CREATOR_CAN_UPDATE_CHANGE_REQUEST"
            }
        });
    });

    it("should not able to delete the change request, when user is not the owner", async () => {
        const createContentReviewResponse = await setupContentReview();
        const contentReview = createContentReviewResponse.data.apw.createContentReview.data;
        const changeRequestStepId = `${contentReview.id}#${contentReview.steps[0].id}`;

        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: {
                step: changeRequestStepId,
                title: `Requesting change on "${entryTitle}"`,
                body: [
                    {
                        type: "h1",
                        text: "Really important!"
                    }
                ],
                resolved: false,
                media: {
                    src: "cloudfront.net/my-file"
                }
            }
        });

        /**
         * Login another user, that is not creator of the change request.
         */
        const notChangeRequestCreatorHandler = useGraphQlHandler({
            path: "/graphql",
            identity: workflowIdentity
        });
        await notChangeRequestCreatorHandler.securityIdentity.login();

        /**
         * Try to delete the same change request with other user
         */
        const changeRequestId = createChangeRequestResponse.data.apw.createChangeRequest.data.id;
        const [deleteChangeRequestResponse] =
            await notChangeRequestCreatorHandler.deleteChangeRequestMutation({
                id: changeRequestId
            });

        expect(deleteChangeRequestResponse.data?.apw?.deleteChangeRequest).toMatchObject({
            data: null,
            error: {
                message: "A change request can only be deleted by its creator.",
                code: "ONLY_CREATOR_CAN_DELETE_CHANGE_REQUEST"
            }
        });
    });

    it("should create comment, update it and delete it", async () => {
        const createContentReviewResponse = await setupContentReview();
        const contentReview = createContentReviewResponse.data.apw.createContentReview.data;

        const changeRequestStepId = `${contentReview.id}#${contentReview.steps[0].id}`;

        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: {
                step: changeRequestStepId,
                title: `Requesting change on "${entryTitle}"`,
                body: [
                    {
                        type: "h1",
                        text: "Really important!"
                    }
                ],
                resolved: false,
                media: {
                    src: "cloudfront.net/my-file"
                }
            }
        });

        const changeRequest = createChangeRequestResponse.data.apw.createChangeRequest.data;

        const [createCommentResponse] = await createCommentMutation({
            data: {
                body: [
                    {
                        type: "p",
                        text: "Comment Test"
                    }
                ],
                changeRequest: changeRequest.id,
                media: {
                    src: "cloudfront.net/my-file"
                }
            }
        });

        expect(createCommentResponse).toMatchObject({
            data: {
                apw: {
                    createComment: {
                        data: {
                            id: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });
        const commentId = createCommentResponse.data.apw.createComment.data.id;

        const [getCommentResponse] = await getCommentQuery({
            id: commentId
        });

        expect(getCommentResponse).toMatchObject({
            data: {
                apw: {
                    getComment: {
                        data: {
                            id: commentId,
                            body: [
                                {
                                    type: "p",
                                    text: "Comment Test"
                                }
                            ],
                            changeRequest: changeRequest.id,
                            media: {
                                src: "cloudfront.net/my-file"
                            }
                        },
                        error: null
                    }
                }
            }
        });

        const [updateCommentResponse] = await updateCommentMutation({
            id: commentId,
            data: {
                body: [
                    {
                        type: "h1",
                        text: "Heading"
                    }
                ]
            }
        });

        expect(updateCommentResponse).toMatchObject({
            data: {
                apw: {
                    updateComment: {
                        data: {
                            id: commentId,
                            body: [
                                {
                                    type: "h1",
                                    text: "Heading"
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        const [deleteCommentResponse] = await deleteCommentMutation({
            id: commentId
        });

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
    });
});
