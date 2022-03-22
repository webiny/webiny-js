import { ApwReviewer, ApwWorkflowStepTypes } from "~/types";
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
    type: ApwWorkflowStepTypes;
    reviewers: Array<{ id: string }>;
}

const createWorkflowStep = (params: CreateWorkflowStepParams) => ({
    ...params,
    id: getNanoid(),
    reviewers: params.reviewers.map(reviewer => reviewer.id)
});

export default {
    reviewerModelId: "apwReviewerModelDefinition",
    createWorkflowStep,
    createWorkflow: (params: CreateWorkflowParams, reviewers: ApwReviewer[]) => ({
        app: "pageBuilder",
        title: "Main workflow",
        steps: [
            createWorkflowStep({
                title: "Legal Review",
                type: ApwWorkflowStepTypes.MANDATORY_BLOCKING,
                reviewers
            })
        ],
        scope: {
            type: "default",
            data: null
        },
        ...params
    }),
    createWorkflowWithThreeSteps: (params: CreateWorkflowParams, reviewers: ApwReviewer[]) => ({
        app: "pageBuilder",
        title: "Main workflow",
        steps: [
            createWorkflowStep({
                title: "Legal Review",
                type: ApwWorkflowStepTypes.MANDATORY_BLOCKING,
                reviewers
            }),
            createWorkflowStep({
                title: "Design Review",
                type: ApwWorkflowStepTypes.MANDATORY_NON_BLOCKING,
                reviewers
            }),
            createWorkflowStep({
                title: "Copy Review",
                type: ApwWorkflowStepTypes.NON_MANDATORY,
                reviewers
            })
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
            createWorkflowStep({
                title: "Legal Review",
                type: ApwWorkflowStepTypes.MANDATORY_BLOCKING,
                reviewers: [{ id: "12345678#0001" }]
            }),
            createWorkflowStep({
                title: "Design Review",
                type: ApwWorkflowStepTypes.MANDATORY_BLOCKING,
                reviewers: [{ id: "12345678#0001" }]
            })
        ],
        scope: {
            type: "pb",
            data: {
                categories: ["static"]
            }
        }
    }
};
