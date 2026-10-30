import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { UpdateWorkflowSettingsUseCase } from "~/settings/useCases/updateWorkflowSettings/abstractions.js";

export interface FakeUpdateWorkflowSettingsUseCase extends UpdateWorkflowSettingsUseCase.Interface {
    execute: Mock<UpdateWorkflowSettingsUseCase.Interface["execute"]>;
}

// The server returns the saved record (A108); the fake answers the list it was sent.
const echoSettings = (settings: WorkflowSettings): Promise<WorkflowSettings> => {
    return Promise.resolve(settings);
};

export const createFakeUpdateWorkflowSettingsUseCase = (): FakeUpdateWorkflowSettingsUseCase => {
    return { execute: vi.fn(echoSettings) };
};
