import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";

export interface FakeWorkflowEditorUseCases extends IWorkflowEditorUseCases {
    listModels: Mock<IWorkflowEditorUseCases["listModels"]>;
    getWorkflow: Mock<IWorkflowEditorUseCases["getWorkflow"]>;
    storeWorkflow: Mock<IWorkflowEditorUseCases["storeWorkflow"]>;
    deleteWorkflow: Mock<IWorkflowEditorUseCases["deleteWorkflow"]>;
}

/*
 * Fake editor use cases with sensible defaults: one model row with a bound workflow, and every
 * read, store and delete resolves the default workflow. Tests override single methods with
 * `mockResolvedValue` or `mockRejectedValue`.
 */
export const createFakeEditorUseCases = (): FakeWorkflowEditorUseCases => {
    const workflow = createEditorWorkflow();
    const page = createWorkflowModelPage();
    return {
        listModels: vi.fn().mockResolvedValue(page),
        getWorkflow: vi.fn().mockResolvedValue(workflow),
        storeWorkflow: vi.fn().mockResolvedValue(workflow),
        deleteWorkflow: vi.fn().mockResolvedValue(workflow)
    };
};
