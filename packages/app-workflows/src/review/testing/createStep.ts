import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";

export const createStep = (overrides: Partial<ReviewStep> = {}): ReviewStep => {
    return {
        id: "step-1",
        title: "Editorial check",
        color: "#FA5723",
        description: null,
        type: "review",
        state: StepState.Pending,
        owner: null,
        comment: null,
        pickedUserId: null,
        candidateTeamIds: [],
        candidateTeams: [],
        assignmentSource: null,
        assignment: null,
        reachedOn: null,
        startedOn: null,
        finishedOn: null,
        taskId: null,
        runs: [],
        issues: [],
        assignments: null,
        ...overrides
    };
};
