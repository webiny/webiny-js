import { ApwReviewer, ApwWorkflowApplications, ApwWorkflowStepTypes } from "~/types";
import { getNanoid } from "~/plugins/utils";

export interface CreateWorkflowParams {
    title?: string;
    app: ApwWorkflowApplications;
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
            type: "custom"
        },
        {
            type: "custom"
        },
        {
            type: "custom"
        }
    ],
    getPageBuilderScope: (pageId: string, pageCategory?: string) => [
        {
            type: "custom",
            data: {
                entries: [],
                models: [],
                pages: [],
                categories: ["dynamic", pageCategory]
            }
        },
        {
            type: "default"
        },
        {
            type: "custom",
            data: {
                entries: [],
                models: [],
                categories: [],
                pages: ["page#1", "page#2", "page#3", pageId]
            }
        },
        {
            type: "custom",
            data: {
                entries: [],
                models: [],
                pages: [],
                categories: ["random", pageCategory]
            }
        },
        {
            type: "custom",
            data: {
                entries: [],
                models: [],
                categories: [],
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
            type: "custom",
            data: {
                entries: [],
                models: [],
                pages: [],
                categories: ["static"]
            }
        }
    }
};
