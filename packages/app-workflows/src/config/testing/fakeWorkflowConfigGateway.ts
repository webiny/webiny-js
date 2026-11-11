import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";

export interface FakeWorkflowConfigGateway extends WorkflowConfigGateway.Interface {
    listStepTypes: Mock<WorkflowConfigGateway.Interface["listStepTypes"]>;
    listAutomationDefinitions: Mock<WorkflowConfigGateway.Interface["listAutomationDefinitions"]>;
    listNotificationTransports: Mock<WorkflowConfigGateway.Interface["listNotificationTransports"]>;
    listTeams: Mock<WorkflowConfigGateway.Interface["listTeams"]>;
    listUsers: Mock<WorkflowConfigGateway.Interface["listUsers"]>;
    listAiModels: Mock<WorkflowConfigGateway.Interface["listAiModels"]>;
    listAiTools: Mock<WorkflowConfigGateway.Interface["listAiTools"]>;
}

/*
 * A config gateway for the use-case tests (R355): the real repository runs over it. Every method
 * answers nothing until a test sets it, so a test names exactly the DTOs it expects to be mapped.
 */
export const createFakeConfigGateway = (): FakeWorkflowConfigGateway => {
    return {
        listStepTypes: vi.fn(),
        listAutomationDefinitions: vi.fn(),
        listNotificationTransports: vi.fn(),
        listTeams: vi.fn(),
        listUsers: vi.fn(),
        listAiModels: vi.fn(),
        listAiTools: vi.fn()
    };
};
