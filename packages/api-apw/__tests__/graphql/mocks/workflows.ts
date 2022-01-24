import { ApwWorkflowStepTypes } from "~/types";
import { getNanoid } from "~/plugins/utils";

interface CreateWorkflowParams {
    title?: string;
    app?: "pageBuilder" | "cms";
    scope?: {
        type: string;
        data?: Record<string, any>;
    };
}

interface CreateWorkflowStepParams {
    title: string;
    id: string;
    type: ApwWorkflowStepTypes;
    reviewers: Array<{ id: string }>;
}

export default {
    reviewerModelId: "apwReviewerModelDefinition",
    createWorkflowStep: (params: CreateWorkflowStepParams) => ({
        ...params,
        reviewers: params.reviewers.map(reviewer => ({
            modelId: "apwReviewerModelDefinition",
            id: reviewer.id
        }))
    }),
    createWorkflow: (params: CreateWorkflowParams, reviewers) => ({
        app: "pageBuilder",
        title: "Main workflow",
        steps: [
            {
                id: getNanoid(),
                title: "Legal Review",
                type: "mandatoryBlocking",
                reviewers: reviewers.map(reviewer => ({
                    modelId: "apwReviewerModelDefinition",
                    id: reviewer.id
                }))
            }
        ],
        scope: {
            type: "default",
            data: null
        },
        ...params
    }),
    createWorkflowWithThreeSteps: (params: CreateWorkflowParams, reviewers) => ({
        app: "pageBuilder",
        title: "Main workflow",
        steps: [
            {
                id: getNanoid(),
                title: "Legal Review",
                type: "mandatoryBlocking",
                reviewers: reviewers.map(reviewer => ({
                    modelId: "apwReviewerModelDefinition",
                    id: reviewer.id
                }))
            },
            {
                id: getNanoid(),
                title: "Design Review",
                type: "mandatoryNonBlocking",
                reviewers: reviewers.map(reviewer => ({
                    modelId: "apwReviewerModelDefinition",
                    id: reviewer.id
                }))
            },
            {
                id: getNanoid(),
                title: "Copy Review",
                type: "notMandatory",
                reviewers: reviewers.map(reviewer => ({
                    modelId: "apwReviewerModelDefinition",
                    id: reviewer.id
                }))
            }
        ],
        scope: {
            type: "default",
            data: null
        },
        ...params
    }),
    scopes: [
        {
            type: "default"
        },
        {
            type: "default"
        },
        {
            type: "pb"
        },
        {
            type: "cm"
        },
        {
            type: "pb"
        }
    ],
    getPageBuilderScope: (pageId: string, pageCategory?: string) => [
        {
            type: "pb",
            data: {
                categories: ["dynamic", pageCategory]
            }
        },
        {
            type: "default"
        },
        {
            type: "pb",
            data: {
                pages: ["page#1", "page#2", "page#3", pageId]
            }
        },
        {
            type: "pb",
            data: {
                categories: ["random", pageCategory]
            }
        },
        {
            type: "pb",
            data: {
                pages: ["page#1", "page#2", "page#3", pageId]
            }
        }
    ],
    mainWorkflow: {
        app: "pageBuilder",
        title: "Main review workflow",
        steps: [
            {
                id: getNanoid(),
                title: "Legal Review",
                type: "mandatoryBlocking",
                reviewers: [{ id: "12345678#0001", modelId: "apwReviewerModelDefinition" }]
            },
            {
                id: getNanoid(),
                title: "Design Review",
                type: "mandatoryBlocking",
                reviewers: [{ id: "12345678#0001", modelId: "apwReviewerModelDefinition" }]
            }
        ],
        scope: {
            type: "pb",
            data: {
                categories: ["static"]
            }
        }
    }
};
