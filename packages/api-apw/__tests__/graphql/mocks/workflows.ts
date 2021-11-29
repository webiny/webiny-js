interface CreateWorkflowParams {
    title?: string;
    app?: "pageBuilder" | "cms";
    scope?: {
        type: string;
        data?: Record<string, any>;
    };
}

export default () => ({
    workflow1: {
        app: "pageBuilder",
        title: "Main workflow",
        steps: [
            {
                title: "Legal Review",
                slug: "legal-review",
                type: "mandatory_blocking",
                reviewers: [{ id: "123" }]
            }
        ],
        scope: {
            type: "default",
            data: null
        }
    },
    updatedWorkflow1: {
        title: "Main workflow - edited",
        steps: [
            {
                title: "Legal Review",
                slug: "legal-review",
                type: "mandatory_blocking",
                reviewers: [{ id: "123" }]
            },
            {
                title: "Design Review",
                slug: "design-review",
                type: "mandatory_blocking",
                reviewers: [{ id: "123456" }]
            }
        ],
        scope: {
            type: "default",
            data: null
        }
    },
    createWorkflow: (params: CreateWorkflowParams) => ({
        app: "pageBuilder",
        title: "Main workflow",
        steps: [
            {
                title: "Legal Review",
                slug: "legal-review",
                type: "mandatory_blocking",
                reviewers: [{ id: "123" }]
            }
        ],
        scope: {
            type: "default"
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
            type: "pb_category"
        },
        {
            type: "cms_model"
        },
        {
            type: "specific"
        }
    ],
    getPageBuilderScope: (pageId: string, pageCategory?: string) => [
        {
            type: "pb_category",
            data: {
                values: ["dynamic", pageCategory]
            }
        },
        {
            type: "default"
        },
        {
            type: "specific",
            data: {
                values: ["page#1", "page#2", "page#3", pageId]
            }
        },
        {
            type: "pb_category",
            data: {
                values: ["random", pageCategory]
            }
        },
        {
            type: "specific",
            data: {
                values: ["page#1", "page#2", "page#3", pageId]
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
                reviewers: [{ id: "123" }]
            },
            {
                title: "Design Review",
                slug: "design-review",
                type: "mandatory_blocking",
                reviewers: [{ id: "123" }]
            }
        ],
        scope: {
            type: "pb_category",
            data: {
                values: ["static"]
            }
        }
    }
});
