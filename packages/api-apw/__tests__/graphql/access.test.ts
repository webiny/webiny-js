/**
 * This test will check if the user, which has access to a single model, can do valid actions.
 */

import { CmsModel } from "@webiny/api-headless-cms/types";
import { useContentHeadlessCmsHandler } from "../utils/useContentHeadlessCmsHandler";
import { accessTestGroup, accessTestModel } from "./mocks/access/plugins";
import { permissions } from "./mocks/access/permissions";
import mocks from "./mocks/workflows";
import { ApwWorkflowApplications } from "~/types";

const model = accessTestModel.contentModel as CmsModel;

describe("access", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        securityIdentity,
        reviewer: reviewerGQL,
        createWorkflowMutation
    } = useContentHeadlessCmsHandler({
        ...options,
        plugins: [accessTestGroup, accessTestModel]
    });

    const { createContentEntryMutation, createContentReviewMutation, until } =
        useContentHeadlessCmsHandler({
            ...options,
            identity: {
                id: "someUserId",
                displayName: "User",
                type: "user"
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
    });

    it("should create a new entry in test model", async () => {
        const title = "Test entry #1";
        const [createResponse] = await createContentEntryMutation(model, {
            data: {
                title
            }
        });

        expect(createResponse).toMatchObject({
            data: {
                createAccessTestModel: {
                    data: {
                        id: expect.any(String),
                        title
                    },
                    error: null
                }
            }
        });
    });

    it("should create request for review", async () => {
        const title = "Test entry #1";
        const [createEntryResponse] = await createContentEntryMutation(model, {
            data: {
                title
            }
        });
        const id = createEntryResponse.data.createAccessTestModel.data.id;

        expect(id).toMatch(/^([a-zA-Z0-9]+)#0001$/);

        const [createReviewRequestResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id,
                    type: "cms_entry",
                    settings: {
                        modelId: model.modelId
                    }
                }
            }
        });

        expect(createReviewRequestResponse).toMatchObject({
            data: {
                apw: {
                    createContentReview: {
                        data: {
                            content: {
                                id
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
                            title
                        },
                        error: null
                    }
                }
            }
        });
    });
});
