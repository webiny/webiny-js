import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IWorkflowConfigUseCases } from "~/editor/useCases/IWorkflowConfigUseCases.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";

export interface FakeWorkflowConfigUseCases extends IWorkflowConfigUseCases {
    listStepTypes: Mock<IWorkflowConfigUseCases["listStepTypes"]>;
    listAutomationDefinitions: Mock<IWorkflowConfigUseCases["listAutomationDefinitions"]>;
    listNotificationTransports: Mock<IWorkflowConfigUseCases["listNotificationTransports"]>;
    listTeams: Mock<IWorkflowConfigUseCases["listTeams"]>;
    listAiModels: Mock<IWorkflowConfigUseCases["listAiModels"]>;
    listAiTools: Mock<IWorkflowConfigUseCases["listAiTools"]>;
}

/*
 * Fake config use cases with sensible defaults: the three step types, all available and without a
 * config schema, no automation, the e-mail transport, no team, no AI model and no AI tool.
 */
export const createFakeConfigUseCases = (): FakeWorkflowConfigUseCases => {
    const stepTypes = [
        createEditorStepType({ type: "review", title: "Review" }),
        createEditorStepType({ type: "automation", title: "Automation" }),
        createEditorStepType({ type: "ai", title: "AI" })
    ];
    return {
        listStepTypes: vi.fn().mockResolvedValue(stepTypes),
        listAutomationDefinitions: vi.fn().mockResolvedValue([]),
        listNotificationTransports: vi.fn().mockResolvedValue([createNotificationTransport()]),
        listTeams: vi.fn().mockResolvedValue({ teams: [], missingIds: [] }),
        listAiModels: vi.fn().mockResolvedValue([]),
        listAiTools: vi.fn().mockResolvedValue([])
    };
};
