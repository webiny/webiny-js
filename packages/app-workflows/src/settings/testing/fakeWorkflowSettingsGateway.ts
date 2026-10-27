import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";

export interface FakeWorkflowSettingsGateway extends WorkflowSettingsGateway.Interface {
    getSettings: Mock<WorkflowSettingsGateway.Interface["getSettings"]>;
    updateSettings: Mock<WorkflowSettingsGateway.Interface["updateSettings"]>;
}

/*
 * A settings gateway for the use-case tests (R355): the real repository runs over it. Every method
 * answers nothing until a test sets it, so a test names exactly the DTOs it expects to be mapped.
 */
export const createFakeWorkflowSettingsGateway = (): FakeWorkflowSettingsGateway => {
    return {
        getSettings: vi.fn(),
        updateSettings: vi.fn()
    };
};
