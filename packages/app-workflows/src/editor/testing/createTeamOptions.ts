import type { WorkflowTeamOptions } from "~/editor/presentation/editor/abstractions.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";

// Two teams, one with members and one without, as `known` and as the last search results.
export const createTeamOptions = (
    overrides: Partial<WorkflowTeamOptions> = {}
): WorkflowTeamOptions => {
    const teams = [
        createWorkflowTeamSummary({ id: "team-1", name: "Legal", memberCount: 3 }),
        createWorkflowTeamSummary({ id: "team-2", name: "Editors", memberCount: 0 })
    ];
    return { results: teams, known: teams, loading: false, failed: false, ...overrides };
};
