import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";

export interface FakeListWorkflowTeamsUseCase extends ListWorkflowTeamsUseCase.Interface {
    execute: Mock<ListWorkflowTeamsUseCase.Interface["execute"]>;
}

// A team lookup that finds no team; tests override the answer.
export const createFakeListWorkflowTeamsUseCase = (): FakeListWorkflowTeamsUseCase => {
    const none: WorkflowTeamList = { teams: [], missingIds: [] };
    return { execute: vi.fn().mockResolvedValue(none) };
};
