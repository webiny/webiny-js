import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";

export interface FakeListWorkflowUsersUseCase extends ListWorkflowUsersUseCase.Interface {
    execute: Mock<ListWorkflowUsersUseCase.Interface["execute"]>;
}

// A user lookup that finds nobody; tests override the answer.
export const createFakeListWorkflowUsersUseCase = (): FakeListWorkflowUsersUseCase => {
    const nobody: WorkflowUserList = { users: [], missingIds: [] };
    return { execute: vi.fn().mockResolvedValue(nobody) };
};
