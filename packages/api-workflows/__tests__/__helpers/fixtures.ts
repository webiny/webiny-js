import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";

export const NOW = "2026-10-09T10:00:00.000Z";
export const REVIEW_TEAM_ID = "team-reviewers";
export const OTHER_TEAM_ID = "team-other";
export const ARTICLE_MODEL = "cms.article";

export interface ReviewStepFixtureParams {
    id: string;
    title: string;
    teams?: string[];
    allowManualPick?: boolean;
    rules?: unknown[];
}

export const createReviewStep = (params: ReviewStepFixtureParams): WorkflowStep => {
    return {
        id: params.id,
        title: params.title,
        color: "#3b82f6",
        type: "review",
        notifications: [],
        config: {
            teams: params.teams ?? [REVIEW_TEAM_ID],
            assignment: {
                strategy: "none",
                allowManualPick: params.allowManualPick ?? false,
                rules: params.rules ?? []
            }
        }
    };
};

export const createWorkflowValues = (overrides: Partial<WorkflowValues> = {}): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "Article review",
        models: [ARTICLE_MODEL],
        steps: [
            createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ],
        ...overrides
    };
};
