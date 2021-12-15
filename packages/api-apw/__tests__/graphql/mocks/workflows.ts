interface CreateWorkflowParams {
    title?: string;
    app?: "pageBuilder" | "cms";
    scope?: {
        type: string;
        data?: Record<string, any>;
    };
}

export default {
    reviewerModelId: "apwReviewerModelDefinition",
    createWorkflow: (params: CreateWorkflowParams, reviewers) => ({
        app: "pageBuilder",
        title: "Main workflow",
        steps: [
            {
                title: "Legal Review",
                slug: "legal-review",
                type: "mandatory_blocking",
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
                title: "Legal Review",
                slug: "legal-review",
                type: "mandatory_blocking",
                reviewers: reviewers.map(reviewer => ({
                    modelId: "apwReviewerModelDefinition",
                    id: reviewer.id
                }))
            },
            {
                title: "Design Review",
                slug: "design-review",
                type: "mandatory_non_blocking",
                reviewers: reviewers.map(reviewer => ({
                    modelId: "apwReviewerModelDefinition",
                    id: reviewer.id
                }))
            },
            {
                title: "Copy Review",
                slug: "copy-review",
                type: "not_mandatory",
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
                title: "Legal Review",
                slug: "legal-review",
                type: "mandatory_blocking",
                reviewers: [{ id: "12345678#0001", modelId: "apwReviewerModelDefinition" }]
            },
            {
                title: "Design Review",
                slug: "design-review",
                type: "mandatory_blocking",
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
