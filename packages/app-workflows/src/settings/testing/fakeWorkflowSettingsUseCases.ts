import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";

export interface FakeWorkflowSettingsUseCases extends WorkflowSettingsUseCases.Interface {
    getSettings: Mock<WorkflowSettingsUseCases.Interface["getSettings"]>;
    updateSettings: Mock<WorkflowSettingsUseCases.Interface["updateSettings"]>;
}

const echoSettings = (settings: WorkflowSettings): Promise<WorkflowSettings> => {
    return Promise.resolve(settings);
};

/*
 * Fake settings use cases: a read answers an empty list, a save answers the list it was given (as
 * the server returns the saved record, A108). Tests override either with `mockResolvedValue`.
 */
export const createFakeSettingsUseCases = (): FakeWorkflowSettingsUseCases => {
    const empty: WorkflowSettings = { exclusions: [] };
    return {
        getSettings: vi.fn().mockResolvedValue(empty),
        updateSettings: vi.fn(echoSettings)
    };
};
